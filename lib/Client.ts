import { BehaviorSubject, Subject } from "rxjs";
import { filter } from "rxjs/operators";
import {
    IClientPageRenderer, IClientTransport, IControllerDataMessage,
    IControllerDataParams, INewPageMessage, IPage, NetworkStatus,
} from "./typings";

export interface IClientConfig {
    transport: IClientTransport;
    url: string;
    renderer: IClientPageRenderer;
}
class Client {
    protected seanceId: string;
    protected url: string;

    protected newPage$ = new Subject<IPage>();
    protected controllerData$ = new Subject<IControllerDataParams>();
    protected networkStatus$ = new BehaviorSubject<NetworkStatus>("connecting");

    constructor(protected config: IClientConfig) {
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
            .pipe(filter((message) => message.type === "new-page"))
            .subscribe((message: INewPageMessage) => this.emitNewPage(message.body.page));
        config.transport.inputMessage$
            .pipe(filter((message) => message.type === "controller-data"))
            .subscribe((message: IControllerDataMessage) => this.emitControllerData(message.body));
    }
    protected connect = () => {
        this.networkStatus$.next("connected");
        this.config.transport.outputMessage$.next({
            type: "initialize",
            body: {
                seanceId: this.seanceId,
                url: this.url,
            },
        });
    }
    protected disconnect = () => {
        this.networkStatus$.next("disconnected");
    }
    protected connecting = () => {
        this.networkStatus$.next("connecting");
    }
    protected emitNewPage(page: IPage) {
        this.newPage$.next(page);
    }
    protected emitControllerData(params: IControllerDataParams) {
        this.controllerData$.next(params);
    }
}
export default Client;
