import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarClock, CreditCard, Search, Wallet, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { BotaoBaixaRapida, BotaoDesfazerBaixa } from "@/components/baixa-pagamento";
import { SectionCard, StatCard } from "@/components/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { faturasDoCartao, resumoCartao } from "@/lib/cartao";
import { getCartaoFn, salvarCartaoFn } from "@/lib/cartao.functions";
import { montaPagamentos, rotuloMes } from "@/lib/pagamentos";
import { painelQueryOptions } from "@/lib/painel-query";
import { brl } from "@/lib/sheets-types";

function normaliza(texto: string) {
  return (texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function mesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function hojeIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function AbaCartao() {
  const { data } = useSuspenseQuery(painelQueryOptions());
  const queryClient = useQueryClient();
  const carregar = useServerFn(getCartaoFn);
  const salvar = useServerFn(salvarCartaoFn);

  const config = useQuery({
    queryKey: ["cartao-config"],
    queryFn: () => carregar(),
    staleTime: 300_000,
  });

  const [limite, setLimite] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [busca, setBusca] = useState("");
  const [aberta, setAberta] = useState<string | null>(mesAtual());

  useEffect(() => {
    if (!config.data) return;
    setLimite(config.data.limiteCartao ? String(config.data.limiteCartao) : "");
    setVencimento(config.data.vencimentoCartao ? String(config.data.vencimentoCartao) : "");
  }, [config.data]);

  const gravar = useMutation({
    mutationFn: (v: { limiteCartao: number; vencimentoCartao: number }) => salvar({ data: v }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["cartao-config"] });
      toast.success("Cartão atualizado.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pagamentos = useMemo(
    () => montaPagamentos(data.despesas, data.abastecimentos),
    [data.despesas, data.abastecimentos],
  );

  const limiteNum = config.data?.limiteCartao ?? 0;
  const resumo = useMemo(() => resumoCartao(pagamentos, limiteNum), [pagamentos, limiteNum]);
  const faturas = useMemo(() => faturasDoCartao(pagamentos), [pagamentos]);

  const termo = normaliza(busca.trim());
  const faturasFiltradas = useMemo(() => {
    if (!termo) return faturas;
    return faturas
      .map((f) => ({
        ...f,
        itens: f.itens.filter((p) =>
          normaliza([p.descricao, p.categoria, p.data, p.dataPagamento, brl(p.valor)].join(" ")).includes(
            termo,
          ),
        ),
      }))
      .filter((f) => f.itens.length > 0);
  }, [faturas, termo]);

  const mes = mesAtual();
  const hoje = hojeIso();
  const faturaAtual = faturas.find((f) => f.mes === mes)?.total ?? 0;
  const proxima = faturas.filter((f) => f.mes > mes).sort((a, b) => a.mes.localeCompare(b.mes))[0];

  const corBarra =
    resumo.nivel === "estourado"
      ? "bg-destructive"
      : resumo.nivel === "atencao"
        ? "bg-warning"
        : "bg-primary";

  return (
    <div className="flex flex-col gap-6">
      <SectionCard
        title="Seu cartão"
        description="Informe o limite e o dia do vencimento para acompanhar quanto ainda pode usar"
      >
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            gravar.mutate({
              limiteCartao: Number(limite.replace(",", ".")) || 0,
              vencimentoCartao: Number(vencimento) || 0,
            });
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="limite-cartao">Limite total (R$)</Label>
            <Input
              id="limite-cartao"
              inputMode="decimal"
              value={limite}
              onChange={(e) => setLimite(e.target.value)}
              placeholder="0,00"
              className="w-40"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="venc-cartao">Dia do vencimento</Label>
            <Input
              id="venc-cartao"
              inputMode="numeric"
              value={vencimento}
              onChange={(e) => setVencimento(e.target.value)}
              placeholder="10"
              className="w-32"
            />
          </div>
          <Button type="submit" disabled={gravar.isPending}>
            Salvar
          </Button>
        </form>

        <div className="mt-5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {resumo.limite > 0
                ? `${Math.round(resumo.percentual)}% do limite usado`
                : "Informe o limite para ver a barra"}
            </span>
            <span className="num font-medium">
              {brl(resumo.usado)} de {brl(resumo.limite)}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-secondary">
            <div
              className={`h-full rounded-full transition-all ${corBarra}`}
              style={{ width: `${resumo.percentual}%` }}
            />
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Limite total" value={brl(resumo.limite)} icon={CreditCard} />
        <StatCard
          label="Limite usado"
          value={brl(resumo.usado)}
          hint="Parcelas ainda não pagas"
          icon={Wallet}
          tone={resumo.nivel === "ok" ? "default" : resumo.nivel === "atencao" ? "warning" : "destructive"}
        />
        <StatCard
          label="Disponível"
          value={brl(resumo.disponivel)}
          icon={Wallet}
          tone="success"
        />
        <StatCard
          label={`Fatura de ${rotuloMes(mes)}`}
          value={brl(faturaAtual)}
          hint={
            config.data?.vencimentoCartao
              ? `Vence todo dia ${config.data.vencimentoCartao}`
              : proxima
                ? `Próxima: ${rotuloMes(proxima.mes)} · ${brl(proxima.total)}`
                : "Sem parcelas futuras"
          }
          icon={CalendarClock}
          tone="warning"
        />
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Procurar compra no cartão"
          className="pl-9"
          aria-label="Procurar no cartão"
        />
        {busca && (
          <button
            type="button"
            onClick={() => setBusca("")}
            aria-label="Limpar busca"
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <SectionCard
        title="Faturas por vencimento"
        description="Toque em um mês para ver as compras e dar baixa"
      >
        {faturasFiltradas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {busca ? "Nenhuma compra encontrada." : "Nenhuma compra no cartão."}
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {faturasFiltradas.map((f) => {
              const expandida = aberta === f.mes || Boolean(termo);
              return (
                <div key={f.mes} className="py-2">
                  <button
                    type="button"
                    onClick={() => setAberta(expandida && !termo ? null : f.mes)}
                    className="flex w-full items-center justify-between gap-3 text-left"
                  >
                    <div className="min-w-0">
                      <div
                        className={`text-sm ${f.mes === mes ? "font-semibold" : "font-medium"}`}
                      >
                        Fatura de {rotuloMes(f.mes)}
                      </div>
                      <div className="num text-xs text-muted-foreground">
                        {f.itens.length} compra{f.itens.length === 1 ? "" : "s"}
                        {f.aberto > 0 ? ` · ${brl(f.aberto)} em aberto` : " · quitada"}
                      </div>
                    </div>
                    <span className="num shrink-0 text-sm font-semibold text-warning">
                      {brl(f.total)}
                    </span>
                  </button>

                  {expandida && (
                    <div className="mt-2 flex flex-col divide-y divide-border rounded-lg bg-muted/40 px-3">
                      {f.itens.map((p) => (
                        <div key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                          <div className="min-w-0">
                            <div className="truncate text-sm">{p.descricao}</div>
                            <div className="num flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                              compra {p.data} · vence {p.dataPagamento}
                              {p.pago ? (
                                <Badge variant="secondary">pago {p.dataPago}</Badge>
                              ) : p.isoPagamento <= hoje ? (
                                <Badge variant="destructive">vencida</Badge>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="num text-sm font-medium">{brl(p.valor)}</span>
                            {p.pago ? (
                              <BotaoDesfazerBaixa pagamento={p} />
                            ) : (
                              <BotaoBaixaRapida pagamento={p} />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
