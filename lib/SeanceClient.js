"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
class SeanceClient {
    constructor({ transportClient }) {
        this.onControllerMessage = new rxjs_1.Subject();
        this.emitNewPage = new rxjs_1.Subject();
        this.subscriptions = [];
        this.emitControllerMessage = transportClient.inputMessage.pipe(operators_1.filter((message) => message.type === "controller-message"), operators_1.map((message) => message.body));
        this.onNavigate = transportClient.inputMessage.pipe(operators_1.filter((message) => message.type === "navigate"), operators_1.map((message) => message.body));
        this.subscriptions.push(this.onControllerMessage.subscribe((body) => {
            transportClient.outputMessage.next({
                type: "controller-message",
                body,
            });
        }));
        this.subscriptions.push(this.emitNewPage.subscribe((body) => transportClient.outputMessage.next({
            type: "new-page",
            body,
        })));
    }
    dispose() {
        this.subscriptions.map((s) => s.unsubscribe());
    }
}
exports.SeanceClient = SeanceClient;
exports.default = SeanceClient;
