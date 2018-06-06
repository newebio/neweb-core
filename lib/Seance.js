"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const debug = require("debug");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const page_1 = require("./util/page");
class Seance {
    constructor(config) {
        this.config = config;
        this.controllers = {};
        this.navigate = (url) => {
            //
        };
        this.emitControllerData = (params) => {
            if (this.client) {
                this.client.emitControllerData.next(params);
            }
        };
        this.emitControllerAction = (params) => {
            const controllerItem = this.controllers[params.id];
            if (controllerItem) {
                controllerItem.controller.actions[params.actionName].next(params.params);
            }
        };
    }
    initialize(params) {
        return __awaiter(this, void 0, void 0, function* () {
            debug("seance")("initialize", params);
            this.url$ = new rxjs_1.BehaviorSubject(params.url);
            this.router = this.config.RoutersFactory.createRouter({ url$: this.url$ });
            const route = yield this.router.route$.pipe(operators_1.take(1)).toPromise();
            if (route.type !== "page") {
                throw new Error("");
            }
            const page = yield page_1.routeToPage(route.page);
            const controllers = yield page_1.fillPage(this.config.ControllersFactory, page);
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
            this.page$ = new rxjs_1.BehaviorSubject(page);
        });
    }
    connect(client) {
        this.client = client;
        this.client.onNavigate.subscribe((params) => this.navigate(params.url));
        this.client.onControllerAction.subscribe(this.emitControllerAction);
        this.page$.subscribe((page) => client.emitNewPage.next({ page }));
    }
}
exports.default = Seance;
