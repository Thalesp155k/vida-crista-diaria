import {cms} from "../lib/cms.mjs";
import handler from "vinext/server/fetch-handler";
import { runWithConnectorBinding } from "../lib/connector-context";
import type { ConnectorBinding } from "../lib/connector-contract.mjs";

const worker = {
  fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext<{ CONNECTORS?: ConnectorBinding }>) {
    const url=new URL(request.url);
    if(url.pathname.startsWith('/sermoes/')){const slug=url.pathname.split('/')[2];url.pathname='/index.html';url.hash='sermao/'+slug;return Response.redirect(url.toString(),302)}
    const mappings=[['/data/catalog.json','/api/catalog'],['/authors.json','/api/authors']];
    let mapped=mappings.find(x=>x[0]===url.pathname)?.[1];
    if(/^\/data\/sermons\/[^/]+\.json$/.test(url.pathname))mapped='/api/sermons/'+url.pathname.split('/').pop()!.replace('.json','');
    if(/^\/data\/pages\/[^/]+\.json$/.test(url.pathname))mapped='/api/texts/'+url.pathname.split('/').pop()!.replace('.json','');
    if(mapped){url.pathname=mapped;return cms(new Request(url,request),env)}
    let binding = ctx.props?.CONNECTORS;
    // Local preview emulates the same request-scoped capability. This branch and
    // the auxiliary service binding are absent from production builds.
    if (import.meta.env.DEV && !binding && env.CONNECTORS) {
      const preview = env.CONNECTORS;
      const expiresAt = Date.now() + 60_000;
      binding = {
        async getContext() {
          if (Date.now() >= expiresAt) return { status: "request_context_expired" };
          return preview.getContext?.() ?? { status: "binding_unavailable" };
        },
        async invoke(connectorId, actionName, args) {
          if (Date.now() >= expiresAt) {
            return { status: "request_context_expired", message: "This request has expired. Please try again." };
          }
          return preview.invoke(connectorId, actionName, args);
        },
      };
    }
    return runWithConnectorBinding(binding, () => handler.fetch(request, env, ctx));
  },
};

export default worker;
