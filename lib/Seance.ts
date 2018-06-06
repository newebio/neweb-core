import debug = require("debug");
import { BehaviorSubject, Subscription } from "rxjs";
import { take } from "rxjs/operators";
import {
    IController, IControllerActionParams, IControllerDataParams, IControllersFactory, IPage,
    IRouter, IRoutersFactory,
    ISeance,
    ISeanceClient,
    ISeanceInitializeParams,
} from "./typings";
import { fillPage, routeToPage } from "./util/page";

export interface ISeanceConfig {
    RoutersFactory: IRoutersFactory;
    ControllersFactory: IControllersFactory;
}
class Seance implements ISeance {
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
        const page = await routeToPage(route.page);
        const controllers = await fillPage(this.config.ControllersFactory, page);
        controllers.map(({ id, controller }) => {
            const subscriptions = Object.keys(controller.data).map((fieldName) => {
                return controller.data[fieldName].subscribe((value) => this.emitControllerData({
                    id,
                    fieldName,
                    value,
                }));
            });
            this.controllers[id] = { controller, subscriptions };
        });
        this.page$ = new BehaviorSubject(page);
    }
    public connect(client: ISeanceClient) {
        this.client = client;
        this.client.onNavigate.subscribe((params) => this.navigate(params.url));
        this.client.onControllerAction.subscribe(this.emitControllerAction);

        this.page$.subscribe((page) => client.emitNewPage.next({ page }));
    }
    protected navigate = (url: string) => {
        //
    }
    protected emitControllerData = (params: IControllerDataParams) => {
        if (this.client) {
            this.client.emitControllerData.next(params);
        }
    }
    protected emitControllerAction = (params: IControllerActionParams) => {
        const controllerItem = this.controllers[params.id];
        if (controllerItem) {
            controllerItem.controller.actions[params.actionName].next(params.params);
        }
    }
}
export default Seance;
