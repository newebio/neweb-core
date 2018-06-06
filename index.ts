export * from "./lib/typings";
export { default as Client } from "./lib/Client";
export { default as Server } from "./lib/Server";
export { default as Seance } from "./lib/Seance";
export { default as ClassicRouter } from "./lib/ClassicRouter";
export * from "./lib/ClassicRouter";
export interface IHistoryContext {
    push(url: string): void;
    replace(url: string): void;
}
