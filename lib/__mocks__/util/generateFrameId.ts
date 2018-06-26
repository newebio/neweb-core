export const generateFrameId = jest.fn().mockImplementation((nonce) => {
    return "frameId" + nonce;
});
