"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
class Client {
    constructor(config) {
        this.config = config;
        this.onControllerData$ = new rxjs_1.Subject();
        this.onNewPage$ = new rxjs_1.Subject();
        // statuses
        this.networkStatus$ = new rxjs_1.BehaviorSubject("connecting");
        this.navigateStatus$ = new rxjs_1.BehaviorSubject("navigating");
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
        // controller actions
        this.emitControllerAction$ = new rxjs_1.Subject();
        this.emitControllerAction$.subscribe((body) => config.transport.outputMessage$.next({
            type: "controller-action",
            body,
        }));
        // navigating
        this.emitNavigate$ = new rxjs_1.Subject();
        this.emitNavigate$.subscribe((body) => {
            this.navigateStatus$.next("navigating");
            config.transport.outputMessage$.next({
                type: "navigate",
                body,
            });
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
        this.navigateStatus$.next("navigating");
        this.onNewPage$.next(page);
    }
    emitControllerData(params) {
        this.onControllerData$.next(params);
    }
}
exports.default = Client;
