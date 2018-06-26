jest.mock("./util/generateFrameId");
import { Seance } from "./Seance";
import { ISeanceClient, IRoute, IPage } from "./typings";
import { Subject, BehaviorSubject } from "rxjs";
import sleep from "sleep-es6";
describe("Seance tests", () => {
    const url1 = "url1";
    let seance: Seance;
    let router: {
        dispose: jest.Mock<any>;
        emitNewUrl: BehaviorSubject<string>;
        onChangeRoute: Subject<IRoute>;
    };
    let ControllersFactory: {
        create: jest.Mock<any>;
    };
    let seanceClient: ISeanceClient;
    let emitNewPage: jest.Mock<IPage>;
    let PageCreator: { createPage: jest.Mock<IPage> };
    beforeEach(() => {
        ControllersFactory = {
            create: jest.fn(),
        };
        router = {
            dispose: jest.fn(),
            emitNewUrl: new BehaviorSubject(""),
            onChangeRoute: new Subject(),
        };
        PageCreator = {
            createPage: jest.fn(),
        };
        seance = new Seance({
            ControllersFactory,
            PageCreator,
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
        seance.connect(seanceClient);
    });
    it("when router resolve page should create new page and emit to client", async () => {
        expect(router.emitNewUrl.getValue()).toBe("url1");
        const controllerInitData = { data: "testdata" };
        const controllerInit = jest.fn().mockReturnValue(controllerInitData);
        ControllersFactory.create.mockImplementation((frameName: string) => {
            return {
                init: controllerInit,
                onMessage: new Subject(),
                postMessage: new Subject(),
                frameName,
            };
        });
        const routePage1 = {
            url: url1,
            rootFrame: {
                name: "frame1",
                params: {},
                frames: {},
            },
        };
        const frameId1 = "frameId1";
        const emptyPage: IPage = {
            url: url1,
            extraInfo: {},
            frames: [
                {
                    data: {},
                    frameId: frameId1,
                    frameName: "frame1",
                    frames: {},
                    params: {},
                },
            ],
            rootFrame: frameId1,
        };

        PageCreator.createPage.mockImplementation((routePage) => {
            if (routePage === routePage1) {
                return emptyPage;
            }
            throw new Error("Unknown route page");
        });

        router.onChangeRoute.next({
            type: "page",
            page: routePage1,
        });
        await sleep(0);
        expect(emitNewPage.mock.calls.length).toBe(1);
        const expectedPageMessage: { page: IPage } = {
            page: {
                extraInfo: {},
                frames: [
                    {
                        frameName: "frame1",
                        frameId: frameId1,
                        data: controllerInitData,
                        frames: {},
                        params: {},
                    },
                ],
                url: url1,
                rootFrame: frameId1,
            },
        };
        expect(emitNewPage.mock.calls[0][0]).toEqual(expectedPageMessage);
    });
});
