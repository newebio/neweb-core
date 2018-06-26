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
const uuidv1 = require("uuid/v1");
const Seance_1 = require("./Seance");
class SeancesManager {
    constructor(config) {
        this.config = config;
        this.seances = {};
    }
    /**
     * if seance exists and sessionId equal return existing Seance
     * else create new Seance by params
     * @param params ISeanceResolvingParams
     */
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
            const seance = yield Seance_1.default.create({
                url: params.url,
                ControllersFactory: this.config.ControllersFactory,
                RoutersFactory: this.config.RoutersFactory,
            });
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
            return uuidv1();
        });
    }
}
exports.SeancesManager = SeancesManager;
exports.default = SeancesManager;
