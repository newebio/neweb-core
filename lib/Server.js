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
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const uid = require("uid-safe");
const Seance_1 = require("./Seance");
class Server {
    constructor(config) {
        this.config = config;
        this.seances = {};
        this.config.transport.onConnect$.subscribe((transportClient) => {
            debug("server")("new client", transportClient);
            transportClient.inputMessage$
                .pipe(operators_1.filter((message) => message.type === "initialize"))
                .subscribe((message) => this.onSeanceRequest({
                client: this.createSeanceClient(transportClient),
                seanceId: message.body.seanceId,
                extraInfo: transportClient.getExtraInfo(),
                sessionId: transportClient.getSessionId(),
                url: message.body.url,
            }));
        });
    }
    onSeanceRequest(params) {
        return __awaiter(this, void 0, void 0, function* () {
            debug("server")("initialize", params);
            const seance = yield this.resolveSeance(params);
            debug("server")("connect seance");
            seance.connect(params.client);
        });
    }
    createSeanceClient(transportClient) {
        const seanceClient = {
            onControllerMessage: new rxjs_1.Subject(),
            emitNewPage: new rxjs_1.Subject(),
            emitControllerMessage: transportClient.inputMessage$
                .pipe(operators_1.filter((message) => message.type === "controller-message"), operators_1.map((message) => message.body)),
            onNavigate: transportClient.inputMessage$
                .pipe(operators_1.filter((message) => message.type === "navigate"), operators_1.map((message) => message.body)),
        };
        seanceClient.onControllerMessage.subscribe((body) => {
            transportClient.outputMessage$.next({
                type: "controller-message",
                body,
            });
        });
        seanceClient.emitNewPage.subscribe((body) => transportClient.outputMessage$.next({
            type: "new-page",
            body,
        }));
        return seanceClient;
    }
    resolveSeance(params) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    createSeance(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const seanceId = yield this.generateSeanceId();
            const seance = new Seance_1.default({
                ControllersFactory: this.config.ControllersFactory,
                RoutersFactory: this.config.RoutersFactory,
            });
            yield seance.initialize(params);
            const now = new Date();
            this.seances[seanceId] = {
                seance,
                sessionId: params.sessionId,
                createdAt: now,
                lastAccessTime: now,
            };
            return seance;
        });
    }
    generateSeanceId() {
        return __awaiter(this, void 0, void 0, function* () {
            return uid(20);
        });
    }
}
exports.Server = Server;
exports.default = Server;
