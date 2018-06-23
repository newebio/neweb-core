"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
class BaseController {
    constructor() {
        this.postMessage = new rxjs_1.Subject();
        this.onMessage = rxjs_1.empty();
        this.onChangeParams = new rxjs_1.Subject();
    }
    init() {
        return {};
    }
    dispose() {
        this.postMessage.unsubscribe();
    }
}
exports.BaseController = BaseController;
exports.default = BaseController;
