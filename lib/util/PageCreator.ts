import { IPage, IPageFrame, IRoutePage, IRoutePageFrame, IPageCreator } from "./../typings";
import { generateFrameId } from "./generateFrameId";
class PageCreator implements IPageCreator {
    protected nonce = 0;
    public createPage(routePage: IRoutePage): IPage {
        const frames = this.collectFrames(routePage.rootFrame);
        const pageFrames = frames.allFrames.map((frame) => this.createFrame(frame.frameId, frame.frame, frame.frames));
        return {
            url: routePage.url,
            frames: pageFrames,
            rootFrame: frames.frameId,
            extraInfo: {},
        };
    }
    public createFrame(
        frameId: string | undefined,
        routePageFrame: IRoutePageFrame,
        children: { [index: string]: string },
    ): IPageFrame {
        if (!frameId) {
            frameId = generateFrameId(++this.nonce);
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
    protected collectFrames(routePageFrame: IRoutePageFrame) {
        const frameId = generateFrameId(++this.nonce);
        let allFrames: Array<{
            frameId: string;
            frame: IRoutePageFrame;
            frames: { [index: string]: string };
        }> = [];
        const frames: { [index: string]: string } = {};
        Object.keys(routePageFrame.frames).map((framePlace) => {
            const childFrame = this.collectFrames(routePageFrame.frames[framePlace]);
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
}
export default PageCreator;
