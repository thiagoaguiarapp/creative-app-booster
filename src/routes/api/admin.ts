import { createFileRoute } from "@tanstack/react-router";

async function responder(request: Request) {
  const { responderAdmin } = await import("@/lib/admin-api.server");
  return responderAdmin(request, true);
}

// Protected server-to-server route: keep user identities out of /api/public/*.
export const Route = createFileRoute("/api/admin")({
  server: { handlers: {
    GET: ({ request }) => responder(request),
    POST: ({ request }) => responder(request),
    OPTIONS: ({ request }) => responder(request),
  } },
});