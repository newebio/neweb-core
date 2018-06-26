import debug = require("debug");
import {
    IClientPageRenderer,
    IControllerMessageParams,
    IPage,
    IPageFrame,
    NavigateStatus,
    NetworkStatus,
    PageRendererComponent,
} from "./typings";
import { BehaviorSubject, Subject, Observable } from "rxjs";
type Component = PageRendererComponent;
export interface IClientPageRendererConfig {
    renderRootComponent: (component: Component) => any;
    replaceRootComponent: (component: Component) => any;
    RendererComponentsFactory: {
        create(name: string, props: any): Component | Promise<any>;
    };
}
export interface IViewProps<PARAMS, DATA, INPUT, OUTPUT> {
    data: DATA;
    children: BehaviorSubject<{ [index: string]: Component }>;
    params: BehaviorSubject<PARAMS>;
    seance: {
        navigate: (url: string) => void | Promise<void>;
        networkStatus: Observable<NetworkStatus>;
        navigateStatus: Observable<NavigateStatus>;
    };
    controller: {
        onMessage: Observable<INPUT>;
        postMessage: Subject<OUTPUT>;
    };
}
interface IFrameItem {
    component: Component;
    controller: {
        onMessage: Subject<any>;
        postMessage: Subject<any>;
    };
    children: BehaviorSubject<{ [index: string]: Component }>;
    params: BehaviorSubject<any>;
    pageFrame: IPageFrame;
}
export class ClientPageRenderer implements IClientPageRenderer {
    public emitControllerMessage = new Subject<IControllerMessageParams>();
    public onNavigate = new Subject<string>();
    public onChangeNavigateStatus = new Subject<NavigateStatus>();
    public onChangeNetworkStatus = new Subject<NetworkStatus>();
    public emitNewPage = new Subject<IPage>();
    public onControllerMessage = new Subject<IControllerMessageParams>();

    protected views: { [index: string]: new (props: IViewProps<any, any, any, any>) => Component } = {};
    protected frames: {
        [index: string]: IFrameItem;
    } = {};
    protected currentPage: IPage;
    constructor(protected config: IClientPageRendererConfig) {
        this.emitNewPage.subscribe((page) => this.newPage(page));
        this.onControllerMessage.subscribe((data) => this.onFrameControllerMessage(data));
    }
    public async newPage(page: IPage) {
        debug("neweb:renderer")("new page", page);
        // await this.loadViews(page);
        const frameIds: string[] = [];
        await Promise.all(
            page.frames.map(async (frame) => {
                if (!this.frames[frame.frameId]) {
                    this.frames[frame.frameId] = await this.createFrame(frame);
                    frameIds.push(frame.frameId);
                } else {
                    const xFrame = this.frames[frame.frameId];
                    if (JSON.stringify(xFrame.params.getValue()) !== frame.params) {
                        xFrame.params.next(frame.params);
                    }
                }
            }),
        );
        // frameIds.map((frameId) => this.renderFrame(frameId, page));
        this.renderFrame(page.rootFrame, page);
        // TODO delete old frames

        if (
            !this.currentPage ||
            this.frames[this.currentPage.rootFrame].pageFrame.frameName !==
                this.frames[page.rootFrame].pageFrame.frameName
        ) {
            this.config.replaceRootComponent(this.frames[page.rootFrame].component);
        }
        this.currentPage = page;
    }
    public async initialize() {
        this.config.renderRootComponent(this.frames[this.currentPage.rootFrame].component);
    }
    public onFrameControllerMessage(params: IControllerMessageParams) {
        const frame = this.frames[params.id];
        if (frame) {
            frame.controller.onMessage.next(params.message);
        }
    }
    protected renderFrame(frameId: string, page: IPage) {
        const frame = this.frames[frameId];
        const pageFrame = page.frames.filter((f) => f.frameId === frameId)[0];
        const children: { [index: string]: Component } = {};
        Object.keys(pageFrame.frames).map((placeName) => {
            const childFrameId = pageFrame.frames[placeName];
            this.renderFrame(childFrameId, page);
            const childFrame = this.frames[childFrameId];
            children[placeName] = childFrame.component;
        });
        frame.children.next(children);
    }
    protected async createFrame(pageFrame: IPageFrame) {
        const children: BehaviorSubject<{ [index: string]: Component }> = new BehaviorSubject({});
        const params = new BehaviorSubject(pageFrame.params);
        const controller = {
            postMessage: new Subject(),
            onMessage: new Subject(),
        };
        controller.postMessage.subscribe((message: any) => {
            this.emitControllerMessage.next({
                id: pageFrame.frameId,
                message,
            });
        });
        const props: IViewProps<any, any, any, any> = {
            data: pageFrame.data,
            controller,
            children,
            params,
            seance: {
                navigate: (url) => this.onNavigate.next(url),
                navigateStatus: this.onChangeNavigateStatus,
                networkStatus: this.onChangeNetworkStatus,
            },
        };
        const component = await this.config.RendererComponentsFactory.create(pageFrame.frameName, props);

        const frameItem = {
            controller,
            pageFrame,
            component,
            data: pageFrame.data,
            children,
            params,
        };
        return frameItem;
    }
}
export default ClientPageRenderer;
