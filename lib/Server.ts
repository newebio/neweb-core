import debug = require("debug");
import { Subject } from "rxjs";
import { filter, map } from "rxjs/operators";
import uid = require("uid-safe");
import {
    IControllerActionMessage, INavigateMessage, ISeance, ISeanceClient,
    ISeanceInitializeMessage, ISeancesFactory, IServerTransport, IServerTransportClient,
} from "./typings";

interface ISeanceRequestParams {
    client: ISeanceClient;
    seanceId?: string;
    sessionId: string;
    url: string;
    extraInfo: any;
}
export interface IServerConfig {
    SeancesFactory: ISeancesFactory;
    transport: IServerTransport;
}
class Server {
    protected seances: {
        [index: string]: {
            seance: ISeance;
            sessionId: string;
            createdAt: Date;
            lastAccessTime: Date;
        };
    } = {};
    constructor(protected config: IServerConfig) {
        this.config.transport.onConnect$.subscribe((transportClient) => {
            debug("server")("new client", transportClient);
            transportClient.inputMessage$
                .pipe(filter((message) => message.type === "initialize"))
                .subscribe((message: ISeanceInitializeMessage) => this.onSeanceRequest({
                    client: this.createSeanceClient(transportClient),
                    seanceId: message.body.seanceId,
                    extraInfo: transportClient.getExtraInfo(),
                    sessionId: transportClient.getSessionId(),
                    url: message.body.url,
                }));
        });
    }
    protected async onSeanceRequest(params: ISeanceRequestParams) {
        debug("server")("initialize", params);
        const seance = await this.resolveSeance(params);
        debug("server")("connect seance");
        seance.connect(params.client);
    }
    protected createSeanceClient(transportClient: IServerTransportClient): ISeanceClient {
        const seanceClient: ISeanceClient = {
            emitControllerData: new Subject(),
            emitNewPage: new Subject(),
            onControllerAction: transportClient.inputMessage$
                .pipe(filter((message) => message.type === "controller-action"),
                    map((message: IControllerActionMessage) => message.body)),
            onNavigate: transportClient.inputMessage$
                .pipe(filter((message) => message.type === "navigate"),
                    map((message: INavigateMessage) => message.body)),
        };
        seanceClient.emitControllerData.subscribe((body) =>
            transportClient.outputMessage$.next({
                type: "controller-data",
                body,
            }));
        seanceClient.emitNewPage.subscribe((body) =>
            transportClient.outputMessage$.next({
                type: "new-page",
                body,
            }));
        return seanceClient;
    }
    protected async resolveSeance(params: ISeanceRequestParams) {
        if (params.seanceId) {
            const seanceItem = this.seances[params.seanceId];
            if (seanceItem) {
                if (seanceItem.sessionId === params.sessionId) {
                    seanceItem.lastAccessTime = new Date();
                    return seanceItem.seance;
                }
            }
        }
        return this.createSeance(params);
    }
    protected async createSeance(params: ISeanceRequestParams) {
        const seanceId = await this.generateSeanceId();
        const seance = await this.config.SeancesFactory.createSeance(params);
        const now = new Date();
        this.seances[seanceId] = {
            seance,
            sessionId: params.sessionId,
            createdAt: now,
            lastAccessTime: now,
        };
        return seance;
    }
    protected async generateSeanceId() {
        return uid(20);
    }
}
export default Server;
