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
const PagesGenerator_1 = require("./util/PagesGenerator");
class Seance {
    constructor(config) {
        this.config = config;
        this.controllers = {};
        this.onNewRoute = (route) => __awaiter(this, void 0, void 0, function* () {
            debug("seance")("new route", route);
            if (route.type === "redirect") {
                this.page = undefined;
                yield this.navigate(route.url);
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
                yield this.onNewRoutePage(route.page);
            }
        });
        this.navigate = (url) => {
            this.router.emitNewUrl.next(url);
        };
        this.onControllerMessage = (params) => {
            debug("seance")("onControllerMessage", params);
            if (this.client) {
                this.client.onControllerMessage.next(params);
            }
        };
        this.emitControllerMessage = (params) => {
            debug("seance")("emitControllerMessage", params);
            const controllerItem = this.controllers[params.id];
            if (controllerItem) {
                controllerItem.controller.postMessage.next(params.message);
            }
        };
        this.router = config.router;
        this.router.onChangeRoute.subscribe(this.onNewRoute);
        this.router.emitNewUrl.next(config.url);
    }
    static create(params) {
        return __awaiter(this, void 0, void 0, function* () {
            debug("seance")("create new seance", params);
            const router = yield params.RoutersFactory.createRouter();
            const pagesGenerator = new PagesGenerator_1.default();
            return new Seance({
                url: params.url,
                router,
                ControllersFactory: params.ControllersFactory,
                PagesGenerator: pagesGenerator,
            });
        });
    }
    connect(client) {
        this.client = client;
        this.client.onNavigate.subscribe((params) => this.navigate(params.url));
        this.client.emitControllerMessage.subscribe(this.emitControllerMessage);
        if (this.page) {
            this.client.emitNewPage.next({ page: this.page });
        }
    }
    dispose() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.router.dispose();
        });
    }
    onNewRoutePage(routePage) {
        return __awaiter(this, void 0, void 0, function* () {
            const page = this.page ? yield this.replacePage(this.page, routePage) : yield this.createPage(routePage);
            if (this.client) {
                this.client.emitNewPage.next({ page });
            }
            this.page = page;
        });
    }
    createPage(routePage) {
        return __awaiter(this, void 0, void 0, function* () {
            const page = yield this.config.PagesGenerator.createPageFromRoute(routePage);
            yield this.createControllersAndFillFrames(page.frames);
            return page;
        });
    }
    createControllersAndFillFrames(frames) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(frames.map((frame) => __awaiter(this, void 0, void 0, function* () {
                const controller = yield this.config.ControllersFactory.create(frame.frameName, {
                    params: frame.params,
                });
                frame.data = yield controller.init();
                this.addController(frame.frameId, controller);
            })));
        });
    }
    addController(id, controller) {
        const subscriptions = [];
        subscriptions.push(controller.onMessage.subscribe((message) => this.onControllerMessage({
            id,
            message,
        })));
        this.controllers[id] = { controller, subscriptions };
    }
    changeControllerParams(id, params) {
        const controllerItem = this.controllers[id];
        if (!controllerItem) {
            // TODO error;
            return;
        }
        controllerItem.controller.onChangeParams.next(params);
    }
    replacePage(oldPage, routePage) {
        return __awaiter(this, void 0, void 0, function* () {
            const { controllersForChangeParams, framesForCreating, controllersIdsForRemoving, page, } = yield this.config.PagesGenerator.replacePageFromRoute(oldPage, routePage);
            yield this.createControllersAndFillFrames(framesForCreating);
            // remove old
            controllersIdsForRemoving.map((id) => this.removeController(id));
            // change params
            controllersForChangeParams.map(({ id, params }) => __awaiter(this, void 0, void 0, function* () { return this.changeControllerParams(id, params); }));
            return page;
        });
    }
    removeController(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const controllerItem = this.controllers[id];
            if (controllerItem) {
                delete this.controllers[id];
                if (typeof controllerItem.controller.dispose === "function") {
                    yield controllerItem.controller.dispose();
                }
                controllerItem.subscriptions.map((s) => s.unsubscribe());
            }
        });
    }
}
exports.Seance = Seance;
exports.default = Seance;
