import {
    IServerTransportClient,
    ISeanceClient,
    IControllerMessageParams,
    IPage,
    IControllerMessage,
    INavigateMessage,
} from "./typings";
import { Subject, Observable, Subscription } from "rxjs";
import { filter, map } from "rxjs/operators";

export class SeanceClient implements ISeanceClient {
    public onControllerMessage = new Subject<IControllerMessageParams>();
    public emitNewPage = new Subject<{ page: IPage }>();
    public emitControllerMessage: Observable<IControllerMessageParams>;
    public onNavigate: Observable<{
        url: string;
    }>;
    public emitNotFound = new Subject<string>();
    protected subscriptions: Subscription[] = [];
    constructor({ transportClient }: { transportClient: IServerTransportClient }) {
        this.emitControllerMessage = transportClient.inputMessage.pipe(
            filter((message) => message.type === "controller-message"),
            map((message: IControllerMessage) => message.body),
        );
        this.onNavigate = transportClient.inputMessage.pipe(
            filter((message) => message.type === "navigate"),
            map((message: INavigateMessage) => message.body),
        );
        this.subscriptions.push(
            this.onControllerMessage.subscribe((body) => {
                transportClient.outputMessage.next({
                    type: "controller-message",
                    body,
                });
            }),
        );
        this.subscriptions.push(
            this.emitNewPage.subscribe((body) =>
                transportClient.outputMessage.next({
                    type: "new-page",
                    body,
                }),
            ),
        );
        this.subscriptions.push(
            this.emitNotFound.subscribe((body) =>
                transportClient.outputMessage.next({
                    type: "not-found",
                    body,
                }),
            ),
        );
    }
    public dispose() {
        this.subscriptions.map((s) => s.unsubscribe());
    }
}
export default SeanceClient;
