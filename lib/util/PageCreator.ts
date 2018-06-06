import { IPage, IPageFrame, IRoutePage, IRoutePageFrame } from "./../typings";
class PageCreator {
    protected nonce = 0;
    public async createPage(routePage: IRoutePage): Promise<IPage> {
        const frames = this.collectFrames(routePage.rootFrame);
        const pageFrames = await Promise.all(frames.allFrames
            .map((frame) => this.createFrame(frame.frameId, frame.frame, frame.frames)));
        return {
            url: routePage.url,
            frames: pageFrames,
            rootFrame: frames.frameId,
            extraInfo: {},
        };
    }
    public async createFrame(
        frameId: string | undefined, routePageFrame: IRoutePageFrame,
        children: { [index: string]: string }): Promise<IPageFrame> {
        if (!frameId) {
            frameId = this.generateFrameId();
        }
        const frameName = routePageFrame.name;
        const params = routePageFrame.params;
        return {
            frameId,
            frameName,
            frames: children,
            data: {},
            actions: [],
            params,
        };
    }
    protected generateFrameId() {
        return (+new Date()).toString() + Math.round(Math.random() * 10000).toString() + ++this.nonce;
    }
    protected collectFrames(routePageFrame: IRoutePageFrame) {
        const frameId = this.generateFrameId();
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
