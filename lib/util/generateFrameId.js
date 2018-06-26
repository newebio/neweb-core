"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function generateFrameId(nonce) {
    return (+new Date()).toString() + Math.round(Math.random() * 10000).toString() + nonce;
}
exports.generateFrameId = generateFrameId;
