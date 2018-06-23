import { Subject } from "rxjs";
import { IController } from "./typings";

export class BaseController implements IController {
    public postMessage = new Subject<any>();
    public onMessage = new Subject<any>();
    public onChangeParams = new Subject<any>();
    public init() {
        return {};
    }
    public dispose() {
        this.postMessage.unsubscribe();
    }
}
export default BaseController;
