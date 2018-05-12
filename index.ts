export const INITIAL_VAR = "__initial";
export const REQUIRE_FUNC_NAME = "loadModule";

export { default as NavigateContext } from "./lib/NavigateContext";
export { default as SeansStatusContext } from "./lib/SeansStatusContext";
export { default as NetworkStatusContext } from "./lib/NetworkStatusContext";
export { default as HistoryContext } from "./lib/HistoryContext";
export { default as StyledContext } from "./lib/StyledContext";
export { default as Link } from "./lib/Link";
export { default as Styled } from "./lib/Styled";

export interface ISeanceInitialInfo {
    seanceId: string;
    page: IPage;
}
export type FrameId = string;
export interface IPage {
    url: string;
    title?: string;
    meta?: IPageMeta[];
    rootFrame: FrameId;
    frames: IPageFrame[];
    modules: IPackInfoModule[];
}
export interface IPageMeta {
    name: string;
    content: string;
}
export interface IPageFrame {
    frameId: FrameId;
    frameName: string;
    frameVersion?: string;
    modules: IPackInfoModule[];
    params: any;
    data: any;
    frames: {
        [index: string]: FrameId;
    };
}
export interface IPageMetaInfo {
    title?: string;
    description?: string;
    meta?: Array<{ name: string; content: string }>;
}

export interface IRemoteFrameControllerDataParams {
    frameId: string;
    data: any;
}
export interface IRemoteFrameControllerDispatchParams {
    frameId: string;
    actionName: string;
    args: any[];
}
export interface IRemoteNewPageParams {
    page: IPage;
}

export interface IHistoryContext {
    push(url: string): void;
    replace(url: string): void;
}
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
export interface IRemoteClient {
    connectTo(server: IRemoteServer): Promise<void> | void;
    newControllerData(params: INewControllerDataParams): Promise<void>;
    newPage(params: IRemoteNewPageParams): Promise<void>;
    error(params: IRemoteErrorParams): Promise<void>;
}
export interface INewControllerDataParams {
    controllerId: string;
    data: any;
}
export interface IRemoteErrorParams {
    text: string;
}

export interface IRemoteServer {
    dispatchControllerAction(params: IDispatchControllerActionParams): Promise<void>;
}
export interface IDispatchControllerActionParams {
    controllerId: string;
    actionName: string;
    args: any[];
}
export enum RemoteMessageType {
    FrameControllerData = "frame-controller-data",
    NewPage = "new-page",
    Initialize = "initialize",
    FrameControllerDispatch = "frame-controller-dispatch",
    Navigate = "navigate",
    Error = "error",
}
export interface IRemoteClientMessage {
    [RemoteMessageType.FrameControllerData]: IRemoteFrameControllerDataParams;
    [RemoteMessageType.NewPage]: IRemoteNewPageParams;
    [RemoteMessageType.Error]: IRemoteErrorParams;
}
export interface IRemoteServerMessage {
    [RemoteMessageType.Initialize]: { seanceId: string };
    [RemoteMessageType.FrameControllerDispatch]: IRemoteFrameControllerDispatchParams;
    [RemoteMessageType.Navigate]: { url: string };
}
export interface IPackInfo extends IPackInfoModule {
    modules: IPackInfoModule[];
}
export interface IPackInfoModule {
    name: string;
    version?: string;
    type: "npm" | "local" | "internal";
}
