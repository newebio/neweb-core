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
const PageComparator_1 = require("./util/PageComparator");
class Seance {
    constructor(config) {
        this.config = config;
        this.controllers = {};
        this.navigate = (url) => {
            this.url$.next(url);
        };
        this.emitControllerData = (params) => {
            if (this.client) {
                this.client.emitControllerData.next(params);
            }
        };
        this.emitControllerAction = (params) => {
            const controllerItem = this.controllers[params.id];
            if (controllerItem) {
                const controllerActions = controllerItem.controller.actions;
                if (!controllerActions || !controllerActions[params.actionName]) {
                    throw new Error("Controller has not action " + params.actionName);
                }
                controllerActions[params.actionName].next(params.params);
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
                const controllerData = controller.data;
                const subscriptions = controllerData ? Object.keys(controller.data || {}).map((fieldName) => {
                    return controllerData[fieldName].subscribe((value) => this.emitControllerData({
                        id,
                        fieldName,
                        value,
                    }));
                }) : [];
                this.controllers[id] = { controller, subscriptions };
            });
            this.page$ = new rxjs_1.BehaviorSubject(page);
            this.router.route$.pipe(operators_1.skip(1)).subscribe((r) => this.onNewRoute(r));
        });
    }
    connect(client) {
        this.client = client;
        this.client.onNavigate.subscribe((params) => this.navigate(params.url));
        this.client.onControllerAction.subscribe(this.emitControllerAction);
        this.page$.subscribe((page) => client.emitNewPage.next({ page }));
    }
    onNewRoute(route) {
        return __awaiter(this, void 0, void 0, function* () {
            debug("seance")("new route", route);
            if (route.type === "redirect") {
                this.navigate(route.url);
                return;
            }
            if (route.type === "page") {
                this.page$.next(yield this.replacePage(this.page$.getValue(), route.page));
                return;
            }
        });
    }
    replacePage(oldPage, routePage) {
        return __awaiter(this, void 0, void 0, function* () {
            const newPage = yield page_1.routeToPage(routePage);
            const pageComparator = new PageComparator_1.default();
            const info = pageComparator.getCompareInfo(oldPage, newPage);
            // TODO WAIT?
            info.frameidsForRemoving.map((id) => this.removeController(id));
            const changeParamsPromises = info.frameForChangeParams.map((frame) => __awaiter(this, void 0, void 0, function* () {
                const controller = this.controllers[frame.frameId].controller;
                if (controller.onChangeParams) {
                    return controller.onChangeParams(frame.params);
                }
            }));
            yield Promise.all(info.newFrames.map((frame) => __awaiter(this, void 0, void 0, function* () {
                const controller = yield this.config.ControllersFactory.create(frame.frameName);
                if (typeof (controller.init) === "function") {
                    yield controller.init();
                }
                const id = frame.frameId;
                const data = {};
                const controllerData = controller.data;
                const subscriptions = controllerData ? Object.keys(controllerData).map((fieldName) => {
                    data[fieldName] = controllerData[fieldName].getValue();
                    return controllerData[fieldName].subscribe((value) => this.emitControllerData({
                        id,
                        fieldName,
                        value,
                    }));
                }) : [];
                this.controllers[id] = { controller, subscriptions };
                frame.data = data;
            })).concat(changeParamsPromises));
            return info.page;
        });
    }
    removeController(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const controllerItem = this.controllers[id];
            if (controllerItem) {
                delete this.controllers[id];
                if (typeof (controllerItem.controller.dispose) === "function") {
                    yield controllerItem.controller.dispose();
                }
                controllerItem.subscriptions.map((s) => s.unsubscribe());
            }
        });
    }
}
exports.default = Seance;
