import { BehaviorSubject, Subject } from "rxjs";
import { filter } from "rxjs/operators";
import {
    IClientTransport,
    IControllerMessage,
    IControllerMessageParams,
    INewPageMessage,
    IPage,
    NavigateStatus,
    NetworkStatus,
} from "./typings";
import { ClientPageRenderer } from "./ClientPageRenderer";

export interface IClientConfig {
    transport: IClientTransport;
    renderer: ClientPageRenderer;
    url: string;
}
export class Client {
    public emitControllerMessage: Subject<IControllerMessageParams>;
    public emitNavigate: Subject<{ url: string }>;
    public onControllerMessage = new Subject<IControllerMessageParams>();
    public onNewPage = new Subject<IPage>();
    // statuses
    public onChangeNetworkStatus = new BehaviorSubject<NetworkStatus>("connecting");
    public onChangeNavigateStatus = new BehaviorSubject<NavigateStatus>("navigating");

    protected seanceId: string;
    protected url: string;

    constructor(protected config: IClientConfig) {
        this.url = this.config.url;
        // controller actions
        this.emitControllerMessage = new Subject();
        this.emitControllerMessage.subscribe((body) =>
            config.transport.outputMessage.next({
                type: "controller-message",
                body,
            }),
        );
        // navigating
        this.emitNavigate = new Subject();
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
            .pipe(filter((message) => message.type === "new-page"))
            .subscribe((message: INewPageMessage) => this.emitNewPage(message.body.page));
        config.transport.inputMessage
            .pipe(filter((message) => message.type === "controller-message"))
            .subscribe((message: IControllerMessage) => this.onControllerMessage.next(message.body));
        // connect renderer
        const renderer = config.renderer;
        this.onNewPage.subscribe(renderer.emitNewPage);
        this.onChangeNavigateStatus.subscribe(renderer.onChangeNavigateStatus);
        this.onChangeNetworkStatus.subscribe(renderer.onChangeNetworkStatus);
        this.onControllerMessage.subscribe(renderer.onControllerMessage);
        renderer.emitControllerMessage.subscribe(this.emitControllerMessage);
        renderer.onNavigate.subscribe((p) => this.emitNavigate.next({ url: p }));
    }
    protected connect = () => {
        this.onChangeNetworkStatus.next("connected");
        this.config.transport.outputMessage.next({
            type: "initialize",
            body: {
                seanceId: this.seanceId,
                url: this.url,
            },
        });
    };
    protected disconnect = () => {
        this.onChangeNetworkStatus.next("disconnected");
    };
    protected connecting = () => {
        this.onChangeNetworkStatus.next("connecting");
    };
    protected emitNewPage(page: IPage) {
        this.onChangeNavigateStatus.next("navigating");
        this.onNewPage.next(page);
    }
}
export default Client;
