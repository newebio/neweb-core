"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const generateFrameId_1 = require("./generateFrameId");
function createPageFromRoute(nonceGenerator, routePage) {
    const frames = collectFrames(nonceGenerator, routePage.rootFrame);
    const pageFrames = frames.allFrames.map((frame) => createFrame(nonceGenerator, frame.frameId, frame.frame, frame.frames));
    return {
        url: routePage.url,
        frames: pageFrames,
        rootFrame: frames.frameId,
        extraInfo: {},
    };
}
exports.createPageFromRoute = createPageFromRoute;
function createFrame(nonceGenerator, frameId, routePageFrame, children) {
    if (!frameId) {
        frameId = generateFrameId_1.generateFrameId(nonceGenerator.getNonce());
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
exports.createFrame = createFrame;
function collectFrames(nonceGenerator, routePageFrame) {
    const frameId = generateFrameId_1.generateFrameId(nonceGenerator.getNonce());
    let allFrames = [];
    const frames = {};
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
exports.collectFrames = collectFrames;
