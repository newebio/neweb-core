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
const debug = require("debug");
const operators_1 = require("rxjs/operators");
const SeanceClient_1 = require("./SeanceClient");
const SeancesManager_1 = require("./SeancesManager");
class Server {
    constructor(config) {
        this.config = config;
        this.subscriptions = [];
        this.onNewTransportClient = (transportClient) => {
            debug("server")("new client", transportClient);
            const onInitialize = transportClient.inputMessage.pipe(operators_1.filter((message) => message.type === "initialize"));
            this.subscriptions.push(onInitialize.subscribe((message) => this.onTransportClientInitialize(transportClient, message)));
        };
        this.onTransportClientInitialize = (transportClient, message) => __awaiter(this, void 0, void 0, function* () {
            const client = this.createSeanceClient(transportClient);
            debug("server")("initialize", message);
            const seance = yield this.config.seancesManager.resolveSeance({
                seanceId: message.body.seanceId,
                sessionId: transportClient.getSessionId(),
                url: message.body.url,
                extraInfo: transportClient.getExtraInfo(),
            });
            debug("server")("connect seance");
            seance.connect(client);
        });
    }
    static create(config) {
        const seancesManager = new SeancesManager_1.default({
            ControllersFactory: config.ControllersFactory,
            RoutersFactory: config.RoutersFactory,
        });
        return new Server({
            seancesManager,
            transport: config.transport,
        });
    }
    start() {
        this.subscriptions.push(this.config.transport.onConnect.subscribe(this.onNewTransportClient));
    }
    stop() {
        this.subscriptions.map((s) => s.unsubscribe());
    }
    createSeanceClient(transportClient) {
        return new SeanceClient_1.default({ transportClient });
    }
}
exports.Server = Server;
exports.default = Server;
