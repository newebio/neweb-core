"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFrameId = jest.fn().mockImplementation((nonce) => {
    return "frameId" + nonce;
});
