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
class ClientPageRenderer {
    constructor(config) {
        this.config = config;
        this.emitControllerMessage = new rxjs_1.Subject();
        this.onNavigate = new rxjs_1.Subject();
        this.onChangeNavigateStatus = new rxjs_1.Subject();
        this.onChangeNetworkStatus = new rxjs_1.Subject();
        this.emitNewPage = new rxjs_1.Subject();
        this.onControllerMessage = new rxjs_1.Subject();
        this.views = {};
        this.frames = {};
        this.emitNewPage.subscribe((page) => this.newPage(page));
        this.onControllerMessage.subscribe((data) => this.onFrameControllerMessage(data));
    }
    newPage(page) {
        return __awaiter(this, void 0, void 0, function* () {
            debug("neweb:renderer")("new page", page);
            // await this.loadViews(page);
            const frameIds = [];
            yield Promise.all(page.frames.map((frame) => __awaiter(this, void 0, void 0, function* () {
                if (!this.frames[frame.frameId]) {
                    this.frames[frame.frameId] = yield this.createFrame(frame);
                    frameIds.push(frame.frameId);
                }
                else {
                    const xFrame = this.frames[frame.frameId];
                    if (JSON.stringify(xFrame.params.getValue()) !== frame.params) {
                        xFrame.params.next(frame.params);
                    }
                }
            })));
            // frameIds.map((frameId) => this.renderFrame(frameId, page));
            this.renderFrame(page.rootFrame, page);
            // TODO delete old frames
            if (!this.currentPage ||
                this.frames[this.currentPage.rootFrame].pageFrame.frameName !==
                    this.frames[page.rootFrame].pageFrame.frameName) {
                this.config.replaceRootComponent(this.frames[page.rootFrame].component);
            }
            this.currentPage = page;
        });
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            this.config.renderRootComponent(this.frames[this.currentPage.rootFrame].component);
        });
    }
    onFrameControllerMessage(params) {
        const frame = this.frames[params.id];
        if (frame) {
            frame.controller.onMessage.next(params.message);
        }
    }
    renderFrame(frameId, page) {
        const frame = this.frames[frameId];
        const pageFrame = page.frames.filter((f) => f.frameId === frameId)[0];
        const children = {};
        Object.keys(pageFrame.frames).map((placeName) => {
            const childFrameId = pageFrame.frames[placeName];
            this.renderFrame(childFrameId, page);
            const childFrame = this.frames[childFrameId];
            children[placeName] = childFrame.component;
        });
        frame.children.next(children);
    }
    createFrame(pageFrame) {
        return __awaiter(this, void 0, void 0, function* () {
            const children = new rxjs_1.BehaviorSubject({});
            const params = new rxjs_1.BehaviorSubject(pageFrame.params);
            const controller = {
                postMessage: new rxjs_1.Subject(),
                onMessage: new rxjs_1.Subject(),
            };
            controller.postMessage.subscribe((message) => {
                this.emitControllerMessage.next({
                    id: pageFrame.frameId,
                    message,
                });
            });
            const props = {
                data: pageFrame.data,
                controller,
                children,
                params,
                seance: {
                    navigateStatus: this.onChangeNavigateStatus,
                    networkStatus: this.onChangeNetworkStatus,
                },
            };
            const component = yield this.config.RendererComponentsFactory.create(pageFrame.frameName, props);
            const frameItem = {
                controller,
                pageFrame,
                component,
                data: pageFrame.data,
                children,
                params,
            };
            return frameItem;
        });
    }
}
exports.ClientPageRenderer = ClientPageRenderer;
exports.default = ClientPageRenderer;
