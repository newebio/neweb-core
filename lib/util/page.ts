import { IControllersFactory, IPage, IRoutePage } from "./../typings";
import PageCreator from "./PageCreator";

export function routeToPage(routePage: IRoutePage) {
    return new PageCreator().createPage(routePage);
}
export async function fillPage(
    controllerFactory: IControllersFactory,
    page: IPage) {
    return Promise.all(page.frames.map(async (frame) => {
        const controller = await controllerFactory.create(frame.frameName);
        frame.data = await controller.init();
        return { id: frame.frameId, controller };
    }));
}
