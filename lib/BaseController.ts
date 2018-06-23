import { empty, Subject } from "rxjs";
import { IController } from "./typings";

export class BaseController implements IController {
    public postMessage = new Subject();
    public onMessage = empty();
    public onChangeParams = new Subject();
    public init() {
        return {};
    }
    public dispose() {
        this.postMessage.unsubscribe();
    }
}
export default BaseController;
