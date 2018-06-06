"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
class Client {
    constructor(config) {
        this.config = config;
        this.newPage$ = new rxjs_1.Subject();
        this.controllerData$ = new rxjs_1.Subject();
        this.networkStatus$ = new rxjs_1.BehaviorSubject("connecting");
        this.connect = () => {
            this.networkStatus$.next("connected");
            this.config.transport.outputMessage$.next({
                type: "initialize",
                body: {
                    seanceId: this.seanceId,
                    url: this.url,
                },
            });
        };
        this.disconnect = () => {
            this.networkStatus$.next("disconnected");
        };
        this.connecting = () => {
            this.networkStatus$.next("connecting");
        };
        this.url = this.config.url;
        this.config.renderer.onControllerAction
            .subscribe((body) => config.transport.outputMessage$.next({
            type: "controller-action",
            body,
        }));
        this.config.renderer.onNavigate
            .subscribe((url) => config.transport.outputMessage$.next({
            type: "navigate",
            body: { url },
        }));
        this.config.renderer.connect({
            emitControllerData: this.controllerData$,
            emitNewPage: this.newPage$,
            networkStatus: this.networkStatus$,
        });
        config.transport.onConnect$.subscribe(this.connect);
        config.transport.onDisconnect$.subscribe(this.disconnect);
        config.transport.onConnecting$.subscribe(this.connecting);
        config.transport.inputMessage$
            .pipe(operators_1.filter((message) => message.type === "new-page"))
            .subscribe((message) => this.emitNewPage(message.body.page));
        config.transport.inputMessage$
            .pipe(operators_1.filter((message) => message.type === "controller-data"))
            .subscribe((message) => this.emitControllerData(message.body));
    }
    emitNewPage(page) {
        this.newPage$.next(page);
    }
    emitControllerData(params) {
        this.controllerData$.next(params);
    }
}
exports.default = Client;
