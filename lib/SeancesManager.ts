import uuidv1 = require("uuid/v1");
import Seance from "./Seance";
import { ISeance, IControllersFactory, IRoutersFactory, ISeanceResolvingParams } from "./typings";
export class SeancesManager {
    protected seances: {
        [index: string]: {
            seance: ISeance;
            sessionId: string;
            createdAt: Date;
            lastAccessTime: Date;
        };
    } = {};
    constructor(protected config: { ControllersFactory: IControllersFactory; RoutersFactory: IRoutersFactory }) {}
    /**
     * if seance exists and sessionId equal return existing Seance
     * else create new Seance by params
     * @param params ISeanceResolvingParams
     */
    public async resolveSeance(params: ISeanceResolvingParams): Promise<ISeance> {
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
    protected async createSeance(params: ISeanceResolvingParams): Promise<ISeance> {
        const seanceId = await this.generateSeanceId();
        const seance = await Seance.create({
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
    }
    protected async generateSeanceId() {
        return uuidv1();
    }
}
export default SeancesManager;
