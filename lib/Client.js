"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
class Client {
    constructor(config) {
        this.config = config;
        this.onControllerMessage = new rxjs_1.Subject();
        this.onNewPage = new rxjs_1.Subject();
        // statuses
        this.onChangeNetworkStatus = new rxjs_1.BehaviorSubject("connecting");
        this.onChangeNavigateStatus = new rxjs_1.BehaviorSubject("navigating");
        this.connect = () => {
            this.onChangeNetworkStatus.next("connected");
            this.config.transport.outputMessage.next({
                type: "initialize",
                body: {
                    seanceId: this.seanceId,
                    url: this.url,
                },
            });
        };
        this.disconnect = () => {
            this.onChangeNetworkStatus.next("disconnected");
        };
        this.connecting = () => {
            this.onChangeNetworkStatus.next("connecting");
        };
        this.url = this.config.url;
        // controller actions
        this.emitControllerMessage = new rxjs_1.Subject();
        this.emitControllerMessage.subscribe((body) => config.transport.outputMessage.next({
            type: "controller-message",
            body,
        }));
        // navigating
        this.emitNavigate = new rxjs_1.Subject();
        this.emitNavigate.subscribe((body) => {
            this.onChangeNavigateStatus.next("navigating");
            config.transport.outputMessage.next({
                type: "navigate",
                body,
            });
        });
        // connect transport
        config.transport.onConnect.subscribe(this.connect);
        config.transport.onDisconnect.subscribe(this.disconnect);
        config.transport.onConnecting.subscribe(this.connecting);
        config.transport.inputMessage
            .pipe(operators_1.filter((message) => message.type === "new-page"))
            .subscribe((message) => this.emitNewPage(message.body.page));
        config.transport.inputMessage
            .pipe(operators_1.filter((message) => message.type === "controller-message"))
            .subscribe((message) => this.onControllerMessage.next(message.body));
        // connect renderer
        const renderer = config.renderer;
        this.onNewPage.subscribe(renderer.emitNewPage);
        this.onChangeNavigateStatus.subscribe(renderer.onChangeNavigateStatus);
        this.onChangeNetworkStatus.subscribe(renderer.onChangeNetworkStatus);
        this.onControllerMessage.subscribe(renderer.onControllerMessage);
        renderer.emitControllerMessage.subscribe(this.emitControllerMessage);
        renderer.onNavigate.subscribe((p) => this.emitNavigate.next({ url: p }));
    }
    emitNewPage(page) {
        this.onChangeNavigateStatus.next("navigating");
        this.onNewPage.next(page);
    }
}
exports.Client = Client;
exports.default = Client;
