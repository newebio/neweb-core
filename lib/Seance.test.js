"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
jest.mock("./util/generateFrameId");
const Seance_1 = require("./Seance");
const rxjs_1 = require("rxjs");
const sleep_es6_1 = require("sleep-es6");
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
    const emptyPage1 = {
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
    const emptyPage2 = {
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
    let seance;
    let router;
    let ControllersFactory;
    let seanceClient;
    let emitNewPage;
    let emitNotFound;
    let PagesGenerator;
    beforeEach(() => {
        ControllersFactory = {
            create: jest.fn(),
        };
        router = {
            dispose: jest.fn(),
            emitNewUrl: new rxjs_1.Subject(),
            onChangeRoute: new rxjs_1.Subject(),
        };
        PagesGenerator = {
            createPageFromRoute: jest.fn(),
            replacePageFromRoute: jest.fn(),
        };
        seance = new Seance_1.Seance({
            ControllersFactory,
            PagesGenerator,
            router,
            url: url1,
        });
        seanceClient = {
            emitControllerMessage: new rxjs_1.Subject(),
            emitNotFound: new rxjs_1.Subject(),
            emitNewPage: new rxjs_1.Subject(),
            onControllerMessage: new rxjs_1.Subject(),
            onNavigate: new rxjs_1.Subject(),
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
        ControllersFactory.create.mockImplementation((frameName, props) => {
            return {
                init: () => ({
                    data: frameName + "data" + props.params.param1,
                }),
                onMessage: new rxjs_1.Subject(),
                postMessage: new rxjs_1.Subject(),
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
    it("when router resolve page should create new page and emit to client", () => __awaiter(this, void 0, void 0, function* () {
        router.emitNewUrl.next(url1);
        yield sleep_es6_1.default(0);
        expect(emitNewPage.mock.calls.length).toBe(1);
        const expectedPageMessage = {
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
    }));
    it("when router emit notFound, should send message to client notFound", () => __awaiter(this, void 0, void 0, function* () {
        router.emitNewUrl.next("notFound1");
        yield sleep_es6_1.default(0);
        expect(emitNotFound.mock.calls).toEqual([["NotFound1"]]);
    }));
    it("when navigate should translate it to router and process after", () => __awaiter(this, void 0, void 0, function* () {
        // first route
        router.emitNewUrl.next("notFound1");
        yield sleep_es6_1.default(0);
        // navigate
        seanceClient.onNavigate.next({
            url: url2,
        });
        yield sleep_es6_1.default(0);
        expect(emitNewPage.mock.calls.length).toBe(1);
        const expectedPageMessage = {
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
    }));
});
