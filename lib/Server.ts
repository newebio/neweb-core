import debug = require("debug");
import { Subscription } from "rxjs";
import { filter } from "rxjs/operators";

import {
    IControllersFactory,
    IRoutersFactory,
    ISeanceClient,
    ISeanceInitializeMessage,
    IServerTransport,
    IServerTransportClient,
    ISeanceResolvingParams,
} from "./typings";
import SeanceClient from "./SeanceClient";
import SeancesManager from "./SeancesManager";

export interface ISeanceConnectable {
    connect(seanceClient: ISeanceClient): void | Promise<void>;
}
export interface IServerConfig {
    transport: IServerTransport;
    seancesManager: {
        resolveSeance: (params: ISeanceResolvingParams) => ISeanceConnectable | Promise<ISeanceConnectable>;
    };
}
export class Server {
    public static create(config: {
        RoutersFactory: IRoutersFactory;
        ControllersFactory: IControllersFactory;
        transport: IServerTransport;
    }) {
        const seancesManager = new SeancesManager({
            ControllersFactory: config.ControllersFactory,
            RoutersFactory: config.RoutersFactory,
        });
        return new Server({
            seancesManager,
            transport: config.transport,
        });
    }

    protected subscriptions: Subscription[] = [];
    constructor(protected config: IServerConfig) {}
    public start() {
        this.subscriptions.push(this.config.transport.onConnect.subscribe(this.onNewTransportClient));
    }
    public stop() {
        this.subscriptions.map((s) => s.unsubscribe());
    }
    protected onNewTransportClient = (transportClient: IServerTransportClient) => {
        debug("server")("new client", transportClient);
        const onInitialize = transportClient.inputMessage.pipe(filter((message) => message.type === "initialize"));
        this.subscriptions.push(
            onInitialize.subscribe((message: ISeanceInitializeMessage) =>
                this.onTransportClientInitialize(transportClient, message),
            ),
        );
    };
    protected onTransportClientInitialize = async (
        transportClient: IServerTransportClient,
        message: ISeanceInitializeMessage,
    ) => {
        const client = this.createSeanceClient(transportClient);
        debug("server")("initialize", message);
        const seance = await this.config.seancesManager.resolveSeance({
            seanceId: message.body.seanceId,
            sessionId: transportClient.getSessionId(),
            url: message.body.url,
            extraInfo: transportClient.getExtraInfo(),
        });
        debug("server")("connect seance");
        seance.connect(client);
    };
    protected createSeanceClient(transportClient: IServerTransportClient): ISeanceClient {
        return new SeanceClient({ transportClient });
    }
}
export default Server;
