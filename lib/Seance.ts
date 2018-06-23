import debug = require("debug");
import { BehaviorSubject, Subscription } from "rxjs";
import { skip, take } from "rxjs/operators";
import {
    IController, IControllerMessageParams,
    IControllersFactory, IPage, IRoute, IRoutePage, IRouter,
    IRoutersFactory, ISeance, ISeanceClient, ISeanceInitializeParams,
} from "./typings";
import { fillPage, routeToPage } from "./util/page";
import PageComparator from "./util/PageComparator";

export interface ISeanceConfig {
    RoutersFactory: IRoutersFactory;
    ControllersFactory: IControllersFactory;
}
export class Seance implements ISeance {
    public page$: BehaviorSubject<IPage>;
    public url$: BehaviorSubject<string>;
    protected client?: ISeanceClient;
    protected router: IRouter;
    protected controllers: {
        [index: string]: {
            controller: IController;
            subscriptions: Subscription[];
        };
    } = {};
    constructor(protected config: ISeanceConfig) { }
    public async initialize(params: ISeanceInitializeParams) {
        debug("seance")("initialize", params);
        this.url$ = new BehaviorSubject(params.url);
        this.router = this.config.RoutersFactory.createRouter({ url$: this.url$ });
        const route = await this.router.route$.pipe(take(1)).toPromise();
        if (route.type !== "page") {
            throw new Error("");
        }
        // Create non-filled page from routePage
        const page = await routeToPage(route.page);
        const controllers = await fillPage(this.config.ControllersFactory, page);
        controllers.map(({ id, controller }) => {
            const subscriptions: Subscription[] = [];
            subscriptions.push(
                controller.onMessage.subscribe((message) => this.onControllerMessage({
                    id,
                    message,
                })),
            );
            this.controllers[id] = { controller, subscriptions };
        });
        this.page$ = new BehaviorSubject(page);
        this.router.route$.pipe(skip(1)).subscribe((r) => this.onNewRoute(r));
    }
    public connect(client: ISeanceClient) {
        this.client = client;
        this.client.onNavigate.subscribe((params) => this.navigate(params.url));
        this.client.emitControllerMessage.subscribe(this.emitControllerMessage);
        this.page$.subscribe((page) => client.emitNewPage.next({ page }));
    }
    protected async onNewRoute(route: IRoute) {
        debug("seance")("new route", route);
        if (route.type === "redirect") {
            this.navigate(route.url);
            return;
        }
        if (route.type === "page") {
            this.page$.next(await this.replacePage(this.page$.getValue(), route.page));
            return;
        }
    }
    protected navigate = (url: string) => {
        this.url$.next(url);
    }
    protected onControllerMessage = (params: IControllerMessageParams) => {
        debug("seance")("onControllerMessage", params);
        if (this.client) {
            this.client.onControllerMessage.next(params);
        }
    }
    protected emitControllerMessage = (params: IControllerMessageParams) => {
        debug("seance")("emitControllerMessage", params);
        const controllerItem = this.controllers[params.id];
        if (controllerItem) {
            controllerItem.controller.postMessage.next(params.message);
        }
    }

    protected async replacePage(oldPage: IPage, routePage: IRoutePage): Promise<IPage> {
        const newPage = await routeToPage(routePage);
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
        await Promise.all<any>(info.newFrames.map(async (frame) => {
            const controller = await this.config.ControllersFactory.create(frame.frameName);
            frame.data = await controller.init();
            const id = frame.frameId;
            const subscriptions: Subscription[] = [];
            subscriptions.push(controller.onMessage.subscribe((message) => this.onControllerMessage({
                id,
                message,
            })));
            this.controllers[id] = { controller, subscriptions };
        }).concat(changeParamsPromises));
        return info.page;
    }
    protected async removeController(id: string) {
        const controllerItem = this.controllers[id];
        if (controllerItem) {
            delete this.controllers[id];
            if (typeof (controllerItem.controller.dispose) === "function") {
                await controllerItem.controller.dispose();
            }
            controllerItem.subscriptions.map((s) => s.unsubscribe());
        }
    }
}
export default Seance;
