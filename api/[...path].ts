import { createCloudflareAuthenticatedGameBackend } from "../src/authenticatedBackend";
import { dispatchApiRoute, resolveApiRoute } from "../src/http";
import { createSupabaseServerClient } from "../src/supabaseClient";

function sendError(res: any, error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  const status = /auth|identity|jwt|missing cloudflare/i.test(message)
    ? 401
    : /not found|unsupported/i.test(message)
      ? 404
      : /required|invalid|minimum|phase|voting|started|lobby/i.test(message)
        ? 400
        : 500;
  res.status(status).json({ error: message });
}

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const pathname = new URL(req.url ?? "/api", `https://${req.headers.host ?? "localhost"}`).pathname;
  const route = resolveApiRoute(req.method ?? "GET", pathname);
  if (!route) {
    res.status(404).json({ error: "Unsupported API route" });
    return;
  }

  try {
    const db = createSupabaseServerClient(process.env);
    const backend = await createCloudflareAuthenticatedGameBackend(db, req.headers);
    const data = await dispatchApiRoute(backend, route, req.body ?? {});
    res.status(200).json({ data });
  } catch (error) {
    sendError(res, error);
  }
}
