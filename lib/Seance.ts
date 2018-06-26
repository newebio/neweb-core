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
    IPagesGenerator,
    IPageFrame,
} from "./typings";
import PagesGenerator from "./util/PagesGenerator";
export interface ISeanceConfig {
    url: string;
    ControllersFactory: IControllersFactory;
    router: IRouter;
    PagesGenerator: IPagesGenerator;
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
        const pagesGenerator = new PagesGenerator();
        return new Seance({
            url: params.url,
            router,
            ControllersFactory: params.ControllersFactory,
            PagesGenerator: pagesGenerator,
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
        const page = this.page ? await this.replacePage(this.page, routePage) : await this.createPage(routePage);

        if (this.client) {
            this.client.emitNewPage.next({ page });
        }
        this.page = page;
    }
    protected async createPage(routePage: IRoutePage) {
        const page = await this.config.PagesGenerator.createPageFromRoute(routePage);
        await this.createControllersAndFillFrames(page.frames);
        return page;
    }
    protected async createControllersAndFillFrames(frames: IPageFrame[]) {
        await Promise.all(
            frames.map(async (frame) => {
                const controller = await this.config.ControllersFactory.create(frame.frameName, {
                    params: frame.params,
                });
                frame.data = await controller.init();
                this.addController(frame.frameId, controller);
            }),
        );
    }
    protected addController(id: string, controller: IController) {
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
    protected changeControllerParams(id: string, params: any) {
        const controllerItem = this.controllers[id];
        if (!controllerItem) {
            // TODO error;
            return;
        }
        controllerItem.controller.onChangeParams.next(params);
    }
    protected async replacePage(oldPage: IPage, routePage: IRoutePage): Promise<IPage> {
        const {
            controllersForChangeParams,
            framesForCreating,
            controllersIdsForRemoving,
            page,
        } = await this.config.PagesGenerator.replacePageFromRoute(oldPage, routePage);
        await this.createControllersAndFillFrames(framesForCreating);
        // remove old
        controllersIdsForRemoving.map((id) => this.removeController(id));
        // change params
        controllersForChangeParams.map(async ({ id, params }) => this.changeControllerParams(id, params));
        return page;
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
