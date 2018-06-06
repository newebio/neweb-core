import { IControllersFactory, IPage, IPageFrame, IRoutePage } from "./../typings";
import PageCreator from "./PageCreator";

export function routeToPage(routePage: IRoutePage) {
    return new PageCreator().createPage(routePage);
}
export async function fillPage(
    controllerFactory: IControllersFactory,
    page: IPage) {
    return Promise.all(page.frames.map(async (frame) => {
        const controller = await fillFrame(controllerFactory, frame);
        return { id: frame.frameId, controller };
    }));
}
export async function fillFrame(controllerFactory: IControllersFactory, frame: IPageFrame) {
    const controller = await controllerFactory.create(frame.frameName);
    const data: any = {};
    Object.keys(controller.data || {}).map((dataName) => {
        data[dataName] = controller.data[dataName].getValue();
    });
    frame.data = data;
    frame.actions = Object.keys(controller.actions || {});
    return controller;
}
