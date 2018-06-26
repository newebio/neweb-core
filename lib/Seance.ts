import debug = require("debug");
import { Subscription } from "rxjs";
import {
    IController,
    IControllerMessageParams,
    IControllersFactory,
    IPage,
    IRoute,
    IRoutePage,
    IRouter,
    IRoutersFactory,
    ISeance,
    ISeanceClient,
    ISeanceInitializeParams,
    IPageCreator,
} from "./typings";
import { fillPage } from "./util/page";
import PageComparator from "./util/PageComparator";
import PageCreator from "./util/PageCreator";

export interface ISeanceConfig {
    url: string;
    ControllersFactory: IControllersFactory;
    router: IRouter;
    PageCreator: IPageCreator;
}
export class Seance implements ISeance {
    public static async create(
        params: ISeanceInitializeParams & {
            RoutersFactory: IRoutersFactory;
            ControllersFactory: IControllersFactory;
        },
    ) {
        debug("seance")("create new seance", params);
        const router = await params.RoutersFactory.createRouter();
        const pageCreator = new PageCreator();
        return new Seance({
            url: params.url,
            router,
            ControllersFactory: params.ControllersFactory,
            PageCreator: pageCreator,
        });
    }
    protected client?: ISeanceClient;
    protected router: IRouter;
    protected controllers: {
        [index: string]: {
            controller: IController;
            subscriptions: Subscription[];
        };
    } = {};
    protected page?: IPage;
    constructor(protected config: ISeanceConfig) {
        this.router = config.router;
        this.router.onChangeRoute.subscribe(this.onNewRoute);
        this.router.emitNewUrl.next(config.url);
    }
    public connect(client: ISeanceClient) {
        this.client = client;
        this.client.onNavigate.subscribe((params) => this.navigate(params.url));
        this.client.emitControllerMessage.subscribe(this.emitControllerMessage);
        if (this.page) {
            this.client.emitNewPage.next({ page: this.page });
        }
    }
    public async dispose() {
        await this.router.dispose();
    }
    protected onNewRoute = async (route: IRoute) => {
        debug("seance")("new route", route);
        if (route.type === "redirect") {
            this.page = undefined;
            await this.navigate(route.url);
            return;
        }
        if (route.type === "notFound") {
            // TODO
            if (this.client) {
                this.client.emitNotFound.next(route.text);
            }
            this.page = undefined;
            return;
        }
        if (route.type === "page") {
            await this.onNewRoutePage(route.page);
        }
    };
    protected async onNewRoutePage(routePage: IRoutePage) {
        // Create non-filled page from routePage
        const page = this.page ? await this.replacePage(this.page, routePage) : await this.createPage(routePage);
        if (this.client) {
            this.client.emitNewPage.next({ page });
        }
    }
    protected async createPage(routePage: IRoutePage) {
        const page = await this.config.PageCreator.createPage(routePage);
        const controllers = await fillPage(this.config.ControllersFactory, page);
        controllers.map(({ id, controller }) => {
            const subscriptions: Subscription[] = [];
            subscriptions.push(
                controller.onMessage.subscribe((message: any) =>
                    this.onControllerMessage({
                        id,
                        message,
                    }),
                ),
            );
            this.controllers[id] = { controller, subscriptions };
        });
        return page;
    }
    protected navigate = (url: string) => {
        this.router.emitNewUrl.next(url);
    };
    protected onControllerMessage = (params: IControllerMessageParams) => {
        debug("seance")("onControllerMessage", params);
        if (this.client) {
            this.client.onControllerMessage.next(params);
        }
    };
    protected emitControllerMessage = (params: IControllerMessageParams) => {
        debug("seance")("emitControllerMessage", params);
        const controllerItem = this.controllers[params.id];
        if (controllerItem) {
            controllerItem.controller.postMessage.next(params.message);
        }
    };
    protected async replacePage(oldPage: IPage, routePage: IRoutePage): Promise<IPage> {
        const newPage = await this.config.PageCreator.createPage(routePage);
        const pageComparator = new PageComparator();
        const info = pageComparator.getCompareInfo(oldPage, newPage);
        // TODO WAIT?
        info.frameidsForRemoving.map((id) => this.removeController(id));
        const changeParamsPromises = info.frameForChangeParams.map(async (frame) => {
            const controller = this.controllers[frame.frameId].controller;
            if (controller.onChangeParams) {
                return controller.onChangeParams.next(frame.params);
            }
        });
        await Promise.all<any>(
            info.newFrames
                .map(async (frame) => {
                    const controller = await this.config.ControllersFactory.create(frame.frameName, {
                        params: frame.params,
                    });
                    frame.data = await controller.init();
                    const id = frame.frameId;
                    const subscriptions: Subscription[] = [];
                    subscriptions.push(
                        controller.onMessage.subscribe((message) =>
                            this.onControllerMessage({
                                id,
                                message,
                            }),
                        ),
                    );
                    this.controllers[id] = { controller, subscriptions };
                })
                .concat(changeParamsPromises),
        );
        return info.page;
    }
    protected async removeController(id: string) {
        const controllerItem = this.controllers[id];
        if (controllerItem) {
            delete this.controllers[id];
            if (typeof controllerItem.controller.dispose === "function") {
                await controllerItem.controller.dispose();
            }
            controllerItem.subscriptions.map((s) => s.unsubscribe());
        }
    }
}
export default Seance;
