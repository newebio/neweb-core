import querystring = require("querystring");
import { Subscription, Subject } from "rxjs";
import { parse } from "url";
import { IPage, IPageRoute, IRoute, IRouter } from "./typings";

export class ClassicRouter implements IRouter {
    public emitNewUrl = new Subject<string>();
    public onChangeRoute = new Subject<IRoute>();
    protected routes: IRouteHandler[] = [];
    protected currentRequest: IRouterRequest;
    protected urlSubscription: Subscription;
    constructor() {
        this.onInit();
        this.urlSubscription = this.emitNewUrl.subscribe((url) => {
            this.navigate({
                request: {
                    url,
                },
            });
        });
    }
    public addRoute(route: IRouteHandler) {
        this.routes.push(route);
    }
    public async navigate(params: IRouterNavigateParams) {
        this.currentRequest = params.request;
        for (const routeHandler of this.routes) {
            const route = routeHandler(params.request, {});
            if (route) {
                this.emitRoute(route);
                return;
            }
        }
        this.emitRoute({
            type: "notFound",
            text: "Unknown request " + params.request.url,
        });
    }
    public async dispose() {
        this.urlSubscription.unsubscribe();
    }
    protected async emitRoute(route: IRoute) {
        this.onChangeRoute.next(route);
    }
    protected onInit() {
        //
    }
}
export interface IRouterRequest {
    url: string;
}
interface IRouterNavigateParams {
    request: IRouterRequest;
}
export type IRouteHandler = (request: IRouterRequest, context: any) => null | IRoute;
export type IRoutePageHandler = (request: IRouterRequest, context: any) => IPageRoute;
export function MatchedRoute(opts: { path: string }, next: IRouteHandler): IRouteHandler {
    return (request: IRouterRequest, context) => {
        const paths = opts.path.split("/");
        const regexpArr: string[] = [];
        const paramsNames: string[] = [];
        for (const pathO of paths) {
            if (pathO.indexOf(":") === 0) {
                regexpArr.push("([^/]+)");
                paramsNames.push(pathO.substr(1));
            } else {
                regexpArr.push(pathO);
            }
        }
        const regexp = new RegExp("^" + regexpArr.join("\\/") + "$", "");
        const url = parse(request.url);
        const pathname = url.pathname || "/";
        const match = pathname.match(regexp);
        if (!match) {
            return null;
        }
        match.shift();
        const params: any = {};
        paramsNames.map((paramName, i) => {
            params[paramName] = match[i];
        });
        context.params = { ...params, ...(url.query ? querystring.parse(url.query) : {}) };
        return !!match ? next(request, context) : null;
    };
}
export function PageRouteWithParent(
    params: {
        parentFrame: string;
        params?: (request: IRouterRequest, context: any) => any;
    },
    next: IRouteHandler,
): IRouteHandler {
    return (request: IRouterRequest, context) => {
        const route = next(request, context);
        if (!route || route.type !== "page") {
            return route;
        }
        const childFrame = route.page.rootFrame;
        const parentParams = params.params ? params.params(request, context) : {};
        Object.keys(parentParams).map((paramName) => {
            delete context.params[paramName];
        });
        return {
            type: "page",
            page: {
                ...route.page,
                rootFrame: {
                    frames: {
                        children: childFrame,
                    },
                    name: params.parentFrame,
                    params: parentParams,
                },
            },
        };
    };
}
export function PageRouteWithAfterLoad(
    params: {
        afterLoad: (page: IPage) => void | Promise<void>;
    },
    handler: IRoutePageHandler,
): IRoutePageHandler {
    return (request: IRouterRequest, context: any) => {
        const page = handler(request, context);
        page.page.afterLoad = params.afterLoad;
        return page;
    };
}
export function PageRouteByFrame(params: {
    frameName: string;
    params?: (request: IRouterRequest, context: any) => any;
}): IRoutePageHandler {
    return (request: IRouterRequest, context: any) => {
        const page: IPageRoute = {
            type: "page",
            page: {
                rootFrame: {
                    name: params.frameName,
                    params: params.params ? params.params(request, context) : context.params,
                    frames: {},
                },
                url: request.url,
            },
        };
        return page;
    };
}
export function RouteWithRedirectOn(
    params: {
        condition: (request: IRouterRequest, context: any) => boolean | Promise<boolean>;
        url: (request: IRouterRequest, context: any) => string;
    },
    next: IRouteHandler,
): IRouteHandler {
    return (request: IRouterRequest, context: any) => {
        if (params.condition(request, context)) {
            return {
                type: "redirect",
                url: params.url(request, context),
            };
        }
        return next(request, context);
    };
}
export default ClassicRouter;
