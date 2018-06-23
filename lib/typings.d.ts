import { Observable, Subject, BehaviorSubject } from "rxjs";
import { EventEmitter } from "events";
import Seance from "./Seance";

export type NetworkStatus = "connecting" | "connected" | "disconnected";
export type NavigateStatus = "navigating" | "navigated";
export interface IClientPageRenderer {
    connect(params: IClientPageRendererConnectParams): void | Promise<void>;
    emitControllerMessage: Observable<IControllerMessageParams>;
    onNavigate: Observable<string>;
}
export interface IClientPageRendererConnectParams {
    networkStatus: Observable<NetworkStatus>;
    onControllerMessage: Observable<IControllerMessageParams>;
    emitNewPage: Observable<IPage>;
}

export interface ISeanceClient {
    onControllerMessage: Subject<IControllerMessageParams>;
    emitNewPage: Subject<{
        page: IPage;
    }>;
    emitControllerMessage: Observable<IControllerMessageParams>;
    onNavigate: Observable<{
        url: string;
    }>
}
export interface IControllerMessageParams {
    id: string;
    message: any;
}

export interface IRouterConfig {
    url$: Observable<string>;
}
export interface IRoutersFactory {
    createRouter(params: IRouterConfig): IRouter;
}
export interface ISeancesFactory {
    createSeance(params: ISeanceInitializeParams): ISeance | Promise<ISeance>;
}
export interface ISeanceInitializeParams {
    url: string;
}
export interface ISeance {
    page$: Observable<IPage>;
    connect: (client: ISeanceClient) => void | Promise<void>;
}
export interface IRouter {
    route$: Observable<IRoute>;
}

export interface IControllersFactory {
    create(frameName: string): IController | Promise<IController>;
}
export interface IController {
    dispose: () => Promise<void> | void;
    init: () => Promise<any> | any;
    onChangeParams: Subject<any>;
    postMessage: Subject<any>;
    onMessage: Observable<any>;
}

// transports

export interface IServerTransport {
    onConnect$: Observable<IServerTransportClient>;
}
export interface IServerTransportClient {
    inputMessage$: Observable<IServerTransportClientInputMessage>;
    outputMessage$: Subject<IServerTransportClientOutputMessage>;
    getSessionId(): string;
    getExtraInfo(): any;
}
export type IServerTransportClientOutputMessage = IControllerMessage | INewPageMessage;
export type IClientTransportInputMessage = IServerTransportClientOutputMessage;
export interface IControllerMessage {
    type: "controller-message";
    body: IControllerMessageParams;
}
export interface INewPageMessage {
    type: "new-page";
    body: {
        page: IPage;
    };
}
export type IServerTransportClientInputMessage = ISeanceInitializeMessage | INavigateMessage | IControllerMessage;
export type IClientTransportOutputMessage = IServerTransportClientInputMessage;
export interface ISeanceInitializeMessage {
    type: "initialize";
    body: {
        seanceId?: string;
        url: string;
    };
}
export interface INavigateMessage {
    type: "navigate";
    body: {
        url: string;
    }
}

export interface IClientTransport {
    onConnect$: Observable<void>;
    onConnecting$: Observable<void>;
    onDisconnect$: Observable<void>;
    inputMessage$: Observable<IServerTransportClientOutputMessage>;
    outputMessage$: Subject<IServerTransportClientInputMessage>;
}

// Page
export type FrameId = string;
export interface IPage {
    url: string;
    rootFrame: FrameId;
    frames: IPageFrame[];
    extraInfo: any;
}
export interface IPageMeta {
    name: string;
    content: string;
}
export interface IPageFrame {
    frameId: FrameId;
    frameName: string;
    params: any;
    data: { [index: string]: any };
    frames: {
        [index: string]: FrameId;
    };
}

// Route
export type IRoute = IPageRoute | IRedirectRoute | INotFoundRoute;

export interface IPageRoute {
    type: "page";
    page: IRoutePage;
}
export interface IRedirectRoute {
    type: "redirect";
    url: string;
}
export interface INotFoundRoute {
    type: "notFound";
    text: string;
}
export interface IRoutePage {
    page?: {
        name: string;
        params: any;
    };
    url: string;
    rootFrame: IRoutePageFrame;
    afterLoad?: (page: IPage) => void | Promise<void>;
}
export interface IRoutePageFrame {
    name: string;
    params: any;
    frames: {
        [index: string]: IRoutePageFrame;
    };
}