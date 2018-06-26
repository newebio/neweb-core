"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const generateFrameId_1 = require("./generateFrameId");
class PageCreator {
    constructor() {
        this.nonce = 0;
    }
    createPage(routePage) {
        const frames = this.collectFrames(routePage.rootFrame);
        const pageFrames = frames.allFrames.map((frame) => this.createFrame(frame.frameId, frame.frame, frame.frames));
        return {
            url: routePage.url,
            frames: pageFrames,
            rootFrame: frames.frameId,
            extraInfo: {},
        };
    }
    createFrame(frameId, routePageFrame, children) {
        if (!frameId) {
            frameId = generateFrameId_1.generateFrameId(++this.nonce);
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
    collectFrames(routePageFrame) {
        const frameId = generateFrameId_1.generateFrameId(++this.nonce);
        let allFrames = [];
        const frames = {};
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
exports.default = PageCreator;
