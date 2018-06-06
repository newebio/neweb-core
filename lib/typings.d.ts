import { Observable, Subject, BehaviorSubject } from "rxjs";
import { EventEmitter } from "events";
import Seance from "./Seance";

export type NetworkStatus = "connecting" | "connected" | "disconnected";

export interface IClientPageRenderer {
    connect(params: IClientPageRendererConnectParams): void | Promise<void>;
    onControllerAction: Observable<IControllerActionParams>;
    onNavigate: Observable<string>;
}
export interface IClientPageRendererConnectParams {
    networkStatus: Observable<NetworkStatus>;
    emitControllerData: Observable<IControllerDataParams>;
    emitNewPage: Observable<IPage>;
}

export interface ISeanceClient {
    emitControllerData: Subject<IControllerDataParams>;
    emitNewPage: Subject<{
        page: IPage;
    }>;
    onControllerAction: Observable<IControllerActionParams>;
    onNavigate: Observable<{
        url: string;
    }>
}
export interface IControllerActionParams {
    id: string;
    actionName: string;
    params: any;
}

export interface IControllerDataParams {
    id: string;
    fieldName: string;
    value: any;
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
    data: { [index: string]: BehaviorSubject<any> };
    actions: { [index: string]: Subject<any> };
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
export type IServerTransportClientOutputMessage = IControllerDataMessage | INewPageMessage;
export type IClientTransportInputMessage = IServerTransportClientOutputMessage;
export interface IControllerDataMessage {
    type: "controller-data";
    body: IControllerDataParams;
}
export interface INewPageMessage {
    type: "new-page";
    body: {
        page: IPage;
    };
}
export type IServerTransportClientInputMessage = ISeanceInitializeMessage | INavigateMessage | IControllerActionMessage;
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
export interface IControllerActionMessage {
    type: "controller-action";
    body: IControllerActionParams;
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
    actions: string[];
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