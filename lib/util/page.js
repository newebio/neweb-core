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
const PageCreator_1 = require("./PageCreator");
function routeToPage(routePage) {
    return new PageCreator_1.default().createPage(routePage);
}
exports.routeToPage = routeToPage;
function fillPage(controllerFactory, page) {
    return __awaiter(this, void 0, void 0, function* () {
        return Promise.all(page.frames.map((frame) => __awaiter(this, void 0, void 0, function* () {
            const controller = yield fillFrame(controllerFactory, frame);
            return { id: frame.frameId, controller };
        })));
    });
}
exports.fillPage = fillPage;
function fillFrame(controllerFactory, frame) {
    return __awaiter(this, void 0, void 0, function* () {
        const controller = yield controllerFactory.create(frame.frameName);
        const data = {};
        Object.keys(controller.data || {}).map((dataName) => {
            data[dataName] = controller.data[dataName].getValue();
        });
        frame.data = data;
        frame.actions = Object.keys(controller.actions || {});
        return controller;
    });
}
exports.fillFrame = fillFrame;
