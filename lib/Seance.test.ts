jest.mock("./util/generateFrameId");
import { Seance } from "./Seance";
import { IRoute, IPage, IControllerProps, IControllerMessageParams } from "./typings";
import { Subject } from "rxjs";
import sleep from "sleep-es6";

describe("Seance tests", () => {
    const url1 = "url1";
    const url2 = "url2";
    const frameId1 = "frameId1";
    const frameId2 = "frameId2";
    const routePage1 = {
        url: url1,
        rootFrame: {
            name: "frame1",
            params: { param1: "param1Value" },
            frames: {},
        },
    };
    const routePage2 = {
        url: url2,
        rootFrame: {
            name: "frame2",
            params: { param1: "param1Value2" },
            frames: {},
        },
    };
    const emptyPage1: IPage = {
        url: url1,
        extraInfo: {},
        frames: [
            {
                data: {},
                frameId: frameId1,
                frameName: "frame1",
                frames: {},
                params: { param1: "param1Value" },
            },
        ],
        rootFrame: frameId1,
    };
    const emptyPage2: IPage = {
        url: url2,
        extraInfo: {},
        frames: [
            {
                data: {},
                frameId: frameId2,
                frameName: "frame2",
                frames: {},
                params: { param1: "param1Value2" },
            },
        ],
        rootFrame: frameId2,
    };
    let seance: Seance;
    let router: {
        dispose: jest.Mock<any>;
        emitNewUrl: Subject<string>;
        onChangeRoute: Subject<IRoute>;
    };
    let ControllersFactory: {
        create: jest.Mock<any>;
    };
    let seanceClient: {
        emitControllerMessage: Subject<IControllerMessageParams>;
        emitNotFound: Subject<string>;
        emitNewPage: Subject<{ page: IPage }>;
        onControllerMessage: Subject<IControllerMessageParams>;
        onNavigate: Subject<{ url: string }>;
        dispose: jest.Mock<any>;
    };
    let emitNewPage: jest.Mock<IPage>;
    let emitNotFound: jest.Mock<string>;

    let PagesGenerator: {
        createPageFromRoute: jest.Mock<any>;
        replacePageFromRoute: jest.Mock<any>;
    };
    beforeEach(() => {
        ControllersFactory = {
            create: jest.fn(),
        };
        router = {
            dispose: jest.fn(),
            emitNewUrl: new Subject<string>(),
            onChangeRoute: new Subject(),
        };
        PagesGenerator = {
            createPageFromRoute: jest.fn(),
            replacePageFromRoute: jest.fn(),
        };
        seance = new Seance({
            ControllersFactory,
            PagesGenerator,
            router,
            url: url1,
        });
        seanceClient = {
            emitControllerMessage: new Subject(),
            emitNotFound: new Subject(),
            emitNewPage: new Subject(),
            onControllerMessage: new Subject(),
            onNavigate: new Subject(),
            dispose: jest.fn(),
        };
        emitNewPage = jest.fn();
        seanceClient.emitNewPage.subscribe(emitNewPage);
        emitNotFound = jest.fn();
        seanceClient.emitNotFound.subscribe(emitNotFound);
        seance.connect(seanceClient);

        router.emitNewUrl.subscribe((url) => {
            switch (url) {
                case "url1":
                    router.onChangeRoute.next({
                        type: "page",
                        page: routePage1,
                    });
                    break;
                case "url2":
                    router.onChangeRoute.next({
                        type: "page",
                        page: routePage2,
                    });
                    break;
                case "notFound1":
                    router.onChangeRoute.next({
                        type: "notFound",
                        text: "NotFound1",
                    });
                    break;
                default:
                    throw new Error("Unknown route " + url);
            }
        });

        ControllersFactory.create.mockImplementation((frameName: string, props: IControllerProps<any>) => {
            return {
                init: () => ({
                    data: frameName + "data" + props.params.param1,
                }),
                onMessage: new Subject(),
                postMessage: new Subject(),
            };
        });

        PagesGenerator.createPageFromRoute.mockImplementation((routePage) => {
            if (routePage === routePage1) {
                return emptyPage1;
            }
            if (routePage === routePage2) {
                return emptyPage2;
            }
            throw new Error("Unknown route page");
        });
    });
    it("when router resolve page should create new page and emit to client", async () => {
        router.emitNewUrl.next(url1);
        await sleep(0);
        expect(emitNewPage.mock.calls.length).toBe(1);
        const expectedPageMessage: { page: IPage } = {
            page: {
                extraInfo: {},
                frames: [
                    {
                        frameName: "frame1",
                        frameId: frameId1,
                        data: {
                            data: "frame1dataparam1Value",
                        },
                        frames: {},
                        params: {
                            param1: "param1Value",
                        },
                    },
                ],
                url: url1,
                rootFrame: frameId1,
            },
        };
        expect(emitNewPage.mock.calls[0][0]).toEqual(expectedPageMessage);
    });
    it("when router emit notFound, should send message to client notFound", async () => {
        router.emitNewUrl.next("notFound1");
        await sleep(0);
        expect(emitNotFound.mock.calls).toEqual([["NotFound1"]]);
    });
    it("when navigate should translate it to router and process after", async () => {
        // first route
        router.emitNewUrl.next("notFound1");
        await sleep(0);
        // navigate
        seanceClient.onNavigate.next({
            url: url2,
        });
        await sleep(0);
        expect(emitNewPage.mock.calls.length).toBe(1);
        const expectedPageMessage: { page: IPage } = {
            page: {
                extraInfo: {},
                frames: [
                    {
                        frameName: "frame2",
                        frameId: frameId2,
                        data: {
                            data: "frame2dataparam1Value2",
                        },
                        frames: {},
                        params: {
                            param1: "param1Value2",
                        },
                    },
                ],
                url: url2,
                rootFrame: frameId2,
            },
        };
        expect(emitNewPage.mock.calls[0][0]).toEqual(expectedPageMessage);
    });
});
