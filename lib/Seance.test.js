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
    let seance;
    let router;
    let ControllersFactory;
    let seanceClient;
    let emitNewPage;
    let PageCreator;
    beforeEach(() => {
        ControllersFactory = {
            create: jest.fn(),
        };
        router = {
            dispose: jest.fn(),
            emitNewUrl: new rxjs_1.BehaviorSubject(""),
            onChangeRoute: new rxjs_1.Subject(),
        };
        PageCreator = {
            createPage: jest.fn(),
        };
        seance = new Seance_1.Seance({
            ControllersFactory,
            PageCreator,
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
        seance.connect(seanceClient);
    });
    it("when router resolve page should create new page and emit to client", () => __awaiter(this, void 0, void 0, function* () {
        expect(router.emitNewUrl.getValue()).toBe("url1");
        const controllerInitData = { data: "testdata" };
        const controllerInit = jest.fn().mockReturnValue(controllerInitData);
        ControllersFactory.create.mockImplementation((frameName) => {
            return {
                init: controllerInit,
                onMessage: new rxjs_1.Subject(),
                postMessage: new rxjs_1.Subject(),
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
        const emptyPage = {
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
        yield sleep_es6_1.default(0);
        expect(emitNewPage.mock.calls.length).toBe(1);
        const expectedPageMessage = {
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
    }));
});
