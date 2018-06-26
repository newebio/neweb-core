"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const pages_1 = require("./pages");
const PageComparator_1 = require("./PageComparator");
class PagesGenerator {
    constructor() {
        this.nonce = 0;
    }
    createPageFromRoute(routePage) {
        return __awaiter(this, void 0, void 0, function* () {
            const page = pages_1.createPageFromRoute(this, routePage);
            return page;
        });
    }
    replacePageFromRoute(oldPage, routePage) {
        const newPage = pages_1.createPageFromRoute(this, routePage);
        const pageComparator = new PageComparator_1.default();
        const info = pageComparator.getCompareInfo(oldPage, newPage);
        return {
            page: info.page,
            framesForCreating: info.newFrames,
            controllersIdsForRemoving: info.frameidsForRemoving,
            controllersForChangeParams: info.frameForChangeParams.map(({ frameId, params }) => ({
                id: frameId,
                params,
            })),
        };
    }
    getNonce() {
        return ++this.nonce;
    }
}
exports.PagesGenerator = PagesGenerator;
exports.default = PagesGenerator;
