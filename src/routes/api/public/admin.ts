import { createFileRoute } from "@tanstack/react-router";

async function responder(request: Request) {
  const { responderAdmin } = await import("@/lib/admin-api.server");
  return responderAdmin(request, false);
}

// Public prefix may return aggregate statistics only, never personal data.
export const Route = createFileRoute("/api/public/admin")({
  server: { handlers: {
    GET: ({ request }) => responder(request),
    POST: ({ request }) => responder(request),
    OPTIONS: ({ request }) => responder(request),
  } },
});