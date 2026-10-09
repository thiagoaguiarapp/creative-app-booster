import { createFileRoute } from "@tanstack/react-router";
import { RepassesContent } from "@/components/repasses-content";
import { painelQueryOptions } from "@/lib/painel-query";

export const Route = createFileRoute("/repasses")({
  head: () => ({
    meta: [
      { title: "Recebimento e repasse — No Corre" },
      {
        name: "description",
        content: "Acompanhe os repasses das plataformas por aplicativo, forma de recebimento e data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:title", content: "Recebimento e repasse — No Corre" },
      {
        property: "og:description",
        content: "Repasses das plataformas por aplicativo, forma de recebimento e data.",
      },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(painelQueryOptions());
  },
  errorComponent: ({ error }) => (
    <div role="alert" className="p-6 text-sm text-destructive">
      {(error as Error).message}
    </div>
  ),
  notFoundComponent: () => <div className="p-6">Nada encontrado.</div>,
  component: RepassesPage,
});

function RepassesPage() {
  return <RepassesContent />;
}
