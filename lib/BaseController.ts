import { Subject } from "rxjs";
import { IController, IControllerProps } from "./typings";

export class BaseController<P> implements IController {
    public postMessage = new Subject<any>();
    public onMessage = new Subject<any>();
    public onChangeParams = new Subject<any>();
    constructor(protected props: IControllerProps<P>) {}
    public init() {
        return {};
    }
    public dispose() {
        this.postMessage.unsubscribe();
    }
}
export default BaseController;
