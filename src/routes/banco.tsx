import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { AtalhoPaginas } from "@/components/atalho-paginas";
import { AbaCartao } from "@/components/banco/aba-cartao";
import { AbaExtrato } from "@/components/banco/aba-extrato";
import { AbaPagamento } from "@/components/banco/aba-pagamento";
import { PageHeader } from "@/components/shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { painelQueryOptions } from "@/lib/painel-query";

type Aba = "pagamento" | "extrato" | "cartao";

const ABAS: Aba[] = ["pagamento", "extrato", "cartao"];

export const Route = createFileRoute("/banco")({
  validateSearch: (search: Record<string, unknown>): { aba: Aba } => {
    const bruto = String(search["aba"] ?? "pagamento") as Aba;
    return { aba: ABAS.includes(bruto) ? bruto : "pagamento" };
  },
  head: () => ({
    meta: [
      { title: "Banco — Rota Control" },
      {
        name: "description",
        content:
          "Sua conta em um só lugar: pagamentos, extrato de entradas e saídas e o controle do limite do cartão de crédito.",
      },
      { property: "og:title", content: "Banco — Rota Control" },
      {
        property: "og:description",
        content:
          "Sua conta em um só lugar: pagamentos, extrato de entradas e saídas e o controle do limite do cartão de crédito.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(painelQueryOptions());
  },
  errorComponent: ({ error }) => (
    <div role="alert" className="p-6 text-sm text-destructive">
      {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-6">Nada encontrado.</div>,
  component: BancoPage,
});

function BancoPage() {
  const { aba } = Route.useSearch();
  const navigate = useNavigate({ from: "/banco" });

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title="Banco"
        subtitle="Pagamentos, extrato da conta e controle do cartão de crédito"
      />

      <div className="flex flex-col items-center gap-3">
        <AtalhoPaginas />
      </div>

      <Tabs
        value={aba}
        onValueChange={(v) => navigate({ search: { aba: v as Aba } })}
        className="w-full"
      >
        <TabsList className="w-full">
          <TabsTrigger value="pagamento" className="flex-1">
            Pagamento
          </TabsTrigger>
          <TabsTrigger value="extrato" className="flex-1">
            Extrato
          </TabsTrigger>
          <TabsTrigger value="cartao" className="flex-1">
            Cartão
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pagamento" className="mt-6">
          <AbaPagamento />
        </TabsContent>
        <TabsContent value="extrato" className="mt-6">
          <AbaExtrato />
        </TabsContent>
        <TabsContent value="cartao" className="mt-6">
          <AbaCartao />
        </TabsContent>
      </Tabs>
    </div>
  );
}
