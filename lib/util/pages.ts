import { IPage, IRoutePage, IRoutePageFrame, IPageFrame } from "./../typings";
import { generateFrameId } from "./generateFrameId";

export interface INonceGenerator {
    getNonce(): number;
}

export function createPageFromRoute(nonceGenerator: INonceGenerator, routePage: IRoutePage): IPage {
    const frames = collectFrames(nonceGenerator, routePage.rootFrame);
    const pageFrames = frames.allFrames.map((frame) =>
        createFrame(nonceGenerator, frame.frameId, frame.frame, frame.frames),
    );
    return {
        url: routePage.url,
        frames: pageFrames,
        rootFrame: frames.frameId,
        extraInfo: {},
    };
}
export function createFrame(
    nonceGenerator: INonceGenerator,
    frameId: string | undefined,
    routePageFrame: IRoutePageFrame,
    children: { [index: string]: string },
): IPageFrame {
    if (!frameId) {
        frameId = generateFrameId(nonceGenerator.getNonce());
    }
    const frameName = routePageFrame.name;
    const params = routePageFrame.params;
    return {
        frameId,
        frameName,
        frames: children,
        data: {},
        params,
    };
}
export function collectFrames(nonceGenerator: INonceGenerator, routePageFrame: IRoutePageFrame) {
    const frameId = generateFrameId(nonceGenerator.getNonce());
    let allFrames: Array<{
        frameId: string;
        frame: IRoutePageFrame;
        frames: { [index: string]: string };
    }> = [];
    const frames: { [index: string]: string } = {};
    Object.keys(routePageFrame.frames).map((framePlace) => {
        const childFrame = collectFrames(nonceGenerator, routePageFrame.frames[framePlace]);
        frames[framePlace] = childFrame.frameId;
        allFrames = allFrames.concat(childFrame.allFrames);
    });
    allFrames.unshift({
        frameId,
        frame: routePageFrame,
        frames,
    });
    return {
        frameId,
        frame: routePageFrame,
        frames,
        allFrames,
    };
}
