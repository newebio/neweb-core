import { IRoutePage, IPage, IPagesGenerator } from "../typings";
import { createPageFromRoute } from "./pages";
import PageComparator from "./PageComparator";

export class PagesGenerator implements IPagesGenerator {
    protected nonce = 0;
    public async createPageFromRoute(routePage: IRoutePage) {
        const page = createPageFromRoute(this, routePage);
        return page;
    }
    public replacePageFromRoute(oldPage: IPage, routePage: IRoutePage) {
        const newPage = createPageFromRoute(this, routePage);
        const pageComparator = new PageComparator();
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
    public getNonce() {
        return ++this.nonce;
    }
}
export default PagesGenerator;
