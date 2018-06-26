export function generateFrameId(nonce: number) {
    return (+new Date()).toString() + Math.round(Math.random() * 10000).toString() + nonce;
}
