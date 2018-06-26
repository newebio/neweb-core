jest.mock("./SeanceClient");
import { Server } from "./Server";
import { IServerTransportClient, ISeanceInitializeMessage } from "./typings";
import { Subject } from "rxjs";

describe("Server tests", () => {
    it("when connected new client should connect seance to it", async () => {
        const transport = {
            onConnect: new Subject<IServerTransportClient>(),
        };
        const extraInfo = { extra: 1 };
        const sessionId1 = "sessionId1";
        const transportClient1 = {
            inputMessage: new Subject(),
            outputMessage: new Subject(),
            getExtraInfo: () => extraInfo,
            getSessionId: () => sessionId1,
        };
        const seancesManager = {
            resolveSeance: jest.fn(),
        };
        const server = new Server({
            seancesManager,
            transport: transport as any,
        });
        server.start();
        // Connect new client to ServerTransport
        transport.onConnect.next(transportClient1 as any);
        // Client emit new message `Initialize`
        const url1 = "url1Value";
        const initializeMessage: ISeanceInitializeMessage = {
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
        await SeancePromise;
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
    });
});
