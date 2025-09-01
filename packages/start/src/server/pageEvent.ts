import { createRouter } from "radix3";
import { getCookie, setCookie } from "vinxi/http";
import { createRoutes } from "../router/FileRoutes";
import { FetchEvent, PageEvent } from "./types";

function initFromFlash(ctx: FetchEvent) {
  const flash = getCookie(ctx.nativeEvent, "flash");
  if (!flash) return;
  try {
    let param = JSON.parse(flash);
    if (!param || !param.result) return;
    const input = [...param.input.slice(0, -1), new Map(param.input[param.input.length - 1])];
    const result = param.error ? new Error(param.result) : param.result;
    return {
      input,
      url: param.url,
      pending: false,
      result: param.thrown ? undefined : result,
      error: param.thrown ? result : undefined
    };
  } catch (e) {
    console.error(e);
  } finally {
    setCookie(ctx.nativeEvent, "flash", "", { maxAge: 0 });
  }
}

export async function createPageEvent(ctx: FetchEvent) {
  const clientManifest = import.meta.env.MANIFEST["client"]!;
  const serverManifest = import.meta.env.MANIFEST["ssr"]!;
  ctx.response.headers.set("Content-Type", "text/html");
  // const prevPath = ctx.request.headers.get("x-solid-referrer");
  // const mutation = ctx.request.headers.get("x-solid-mutation") === "true";
  const routes = createRoutes();

  let ssr: boolean | undefined = undefined;
  try {
    const router = createRouter({
      routes: routes.reduce((memo: Record<string, { route: any }>, r: any) => {
        const path = r.path
          .replace(/\([^)/]+\)/g, "")
          .replace(/\/+/g, "/")
          .replace(/\*([^\/]*)/g, (_: string, m: string) => `**:${m}`);
        memo[path] = { route: r };
        return memo;
      }, {})
    });
    const pathname = new URL(ctx.request.url).pathname;
    const match = router.lookup(pathname);
    if (match && match.route) {
      ssr = match.route.ssr;
    }
  } catch (e) {
    if (import.meta.env.DEV) console.warn(e);
  }

  const pageEvent: PageEvent = Object.assign(ctx, {
    manifest: await clientManifest.json(),
    assets: [
      ...(await clientManifest.inputs[clientManifest.handler]!.assets()),
      ...(import.meta.env.DEV
        ? await clientManifest.inputs[import.meta.env.START_APP]!.assets()
        : []),
      ...(import.meta.env.START_ISLANDS
        ? (await serverManifest.inputs[serverManifest.handler]!.assets()).filter(
            s => (s as any).attrs.rel !== "modulepreload"
          )
        : [])
    ],
    router: {
      submission: initFromFlash(ctx) as any
    },
    routes,
    ssr,
    // prevUrl: prevPath || "",
    // mutation: mutation,
    // $type: FETCH_EVENT,
    complete: false,
    $islands: new Set<string>()
  });

  return pageEvent;
}
