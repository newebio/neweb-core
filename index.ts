export * from "./lib/typings";
export { BaseController } from "./lib/BaseController";
export { Client } from "./lib/Client";
export { Server } from "./lib/Server";
export { Seance } from "./lib/Seance";
export { ClientPageRenderer, IViewProps } from "./lib/ClientPageRenderer";
export { ClassicRouter } from "./lib/ClassicRouter";
export * from "./lib/ClassicRouter";
export interface IHistoryContext {
    push(url: string): void;
    replace(url: string): void;
}
