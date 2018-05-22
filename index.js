"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INITIAL_VAR = "__initial";
exports.REQUIRE_FUNC_NAME = "loadModule";
var RemoteMessageType;
(function (RemoteMessageType) {
    RemoteMessageType["FrameControllerData"] = "frame-controller-data";
    RemoteMessageType["NewPage"] = "new-page";
    RemoteMessageType["Initialize"] = "initialize";
    RemoteMessageType["FrameControllerDispatch"] = "frame-controller-dispatch";
    RemoteMessageType["Navigate"] = "navigate";
    RemoteMessageType["Error"] = "error";
})(RemoteMessageType = exports.RemoteMessageType || (exports.RemoteMessageType = {}));
