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
jest.mock("./SeanceClient");
const Server_1 = require("./Server");
const rxjs_1 = require("rxjs");
describe("Server tests", () => {
    it("when connected new client should connect seance to it", () => __awaiter(this, void 0, void 0, function* () {
        const transport = {
            onConnect: new rxjs_1.Subject(),
        };
        const extraInfo = { extra: 1 };
        const sessionId1 = "sessionId1";
        const transportClient1 = {
            inputMessage: new rxjs_1.Subject(),
            outputMessage: new rxjs_1.Subject(),
            getExtraInfo: () => extraInfo,
            getSessionId: () => sessionId1,
        };
        const seancesManager = {
            resolveSeance: jest.fn(),
        };
        const server = new Server_1.Server({
            seancesManager,
            transport: transport,
        });
        server.start();
        // Connect new client to ServerTransport
        transport.onConnect.next(transportClient1);
        // Client emit new message `Initialize`
        const url1 = "url1Value";
        const initializeMessage = {
            type: "initialize",
            body: {
                url: url1,
            },
        };
        const seance = {
            connect: jest.fn(),
        };
        const SeancePromise = Promise.resolve(seance);
        seancesManager.resolveSeance.mockImplementation(() => SeancePromise);
        transportClient1.inputMessage.next(initializeMessage);
        yield SeancePromise;
        // Server should resolve Seance and connect SeanceClient to it
        expect(seancesManager.resolveSeance.mock.calls.length).toBe(1);
        const seanceClient = { id: "seanceClient1", dispose: jasmine.any(Function) };
        expect(seancesManager.resolveSeance.mock.calls[0][0]).toEqual({
            url: url1,
            sessionId: sessionId1,
            seanceId: undefined,
            extraInfo,
        });
        expect(seance.connect.mock.calls.length).toBe(1);
        expect(seance.connect.mock.calls[0][0]).toEqual(seanceClient);
    }));
});
