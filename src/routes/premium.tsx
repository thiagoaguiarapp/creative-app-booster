import { createFileRoute, useRouteContext, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  BadgeCheck,
  BarChart3,
  Crown,
  Headphones,
  RotateCcw,
  ShieldOff,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { definirPremiumFn } from "@/lib/premium.functions";
import { comprarAssinatura, ehAppNativo, precoAssinatura, restaurarCompras } from "@/lib/iap";

export const Route = createFileRoute("/premium")({
  component: PremiumPage,
  head: () => ({
    meta: [
      { title: "Plano Premium — Rota Control" },
      {
        name: "description",
        content:
          "Assine o Rota Control Premium: sem anúncios, relatórios avançados e suporte prioritário para entregadores.",
      },
      { property: "og:title", content: "Plano Premium — Rota Control" },
      {
        property: "og:description",
        content: "Sem anúncios, relatórios avançados e suporte prioritário no Rota Control.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Plano Premium — Rota Control" },
      {
        name: "twitter:description",
        content: "Sem anúncios, relatórios avançados e suporte prioritário no Rota Control.",
      },
    ],
  }),
});

const beneficios = [
  {
    icon: ShieldOff,
    titulo: "Zero anúncios",
    texto: "Navegue pelo app sem banners e sem interrupções.",
  },
  {
    icon: BarChart3,
    titulo: "Relatórios avançados",
    texto: "Comparativos por período, evolução e ranking de categorias.",
  },
  {
    icon: Sparkles,
    titulo: "Novidades primeiro",
    texto: "Acesso antecipado às próximas funções do Rota Control.",
  },
  {
    icon: Headphones,
    titulo: "Suporte prioritário",
    texto: "Sua dúvida entra na frente da fila de atendimento.",
  },
];

const PRECO_PADRAO = "R$ 9,90";

function PremiumPage() {
  const context = useRouteContext({ from: "__root__" });
  const isPremium = context.usuario?.isPremium ?? false;
  const router = useRouter();
  const definirPremium = useServerFn(definirPremiumFn);

  const [nativo, setNativo] = useState(false);
  const [preco, setPreco] = useState<string>(PRECO_PADRAO);
  const [assinando, setAssinando] = useState(false);
  const [restaurando, setRestaurando] = useState(false);

  useEffect(() => {
    let ativo = true;
    void ehAppNativo().then(async (ehNativo) => {
      if (!ativo) return;
      setNativo(ehNativo);
      const p = await precoAssinatura();
      if (ativo && p) setPreco(p);
    });
    return () => {
      ativo = false;
    };
  }, []);

  const sincronizar = async (premium: boolean, mensagem: string) => {
    await definirPremium({ data: { ativo: premium } });
    await router.invalidate();
    toast.success(mensagem);
    if (premium) router.navigate({ to: "/" });
  };

  const assinar = async () => {
    setAssinando(true);
    try {
      const r = await comprarAssinatura();
      if (r.ok && r.premium) {
        await sincronizar(true, "Assinatura confirmada! Anúncios removidos.");
        return;
      }
      if (r.ok) {
        toast.error("A compra não liberou o Premium. Tente restaurar as compras.");
        return;
      }
      if (r.motivo === "cancelado") {
        toast.info("Compra cancelada.");
        return;
      }
      if (r.motivo === "indisponivel") {
        // Fora do app nativo (navegador/preview): ativação em modo demonstração.
        await sincronizar(true, "Premium ativado em modo demonstração.");
        return;
      }
      toast.error(r.mensagem ?? "Não foi possível concluir a compra.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao processar a assinatura.");
    } finally {
      setAssinando(false);
    }
  };

  const restaurar = async () => {
    setRestaurando(true);
    try {
      const r = await restaurarCompras();
      if (r.ok && r.premium) {
        await sincronizar(true, "Assinatura restaurada com sucesso!");
        return;
      }
      if (r.ok) {
        toast.info("Nenhuma assinatura ativa encontrada nesta conta Google.");
        return;
      }
      if (r.motivo === "indisponivel") {
        toast.info("Restauração disponível apenas no aplicativo instalado.");
        return;
      }
      toast.error(r.mensagem ?? "Não foi possível restaurar as compras.");
    } finally {
      setRestaurando(false);
    }
  };

  const cancelar = async () => {
    setAssinando(true);
    try {
      await definirPremium({ data: { ativo: false } });
      await router.invalidate();
      toast.success("Plano Premium desativado.");
    } finally {
      setAssinando(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <header className="flex flex-col items-center gap-2 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
          <Crown className="size-7 text-primary" />
        </span>
        <h1 className="font-display text-2xl font-semibold uppercase tracking-wide">
          {isPremium ? "Você é Premium" : "Rota Control Premium"}
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          {isPremium
            ? "Sua assinatura está ativa: anúncios desligados e relatórios completos liberados."
            : "Tire os anúncios do caminho e destrave os relatórios avançados do app."}
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {beneficios.map((b) => (
          <Card key={b.titulo}>
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <b.icon className="size-4 text-primary" />
              <CardTitle className="text-sm">{b.titulo}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground">{b.texto}</CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-primary/40">
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Assinatura mensal
            </p>
            <p className="font-display text-4xl font-semibold">{preco}</p>
            <p className="text-xs text-muted-foreground">
              Cobrança pela sua conta Google. Cancele quando quiser na Play Store.
            </p>
          </div>

          {isPremium ? (
            <Button variant="outline" disabled={assinando} onClick={cancelar}>
              {assinando ? "Processando…" : "Cancelar Premium"}
            </Button>
          ) : (
            <Button size="lg" disabled={assinando} onClick={assinar}>
              <Sparkles className="mr-1 size-4" />
              {assinando ? "Processando…" : "Assinar agora"}
            </Button>
          )}

          <Button variant="ghost" disabled={restaurando} onClick={restaurar}>
            <RotateCcw className="mr-1 size-4" />
            {restaurando ? "Restaurando…" : "Restaurar compras"}
          </Button>

          {!nativo && (
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <BadgeCheck className="mt-0.5 size-3.5 shrink-0" />
              A cobrança pela Google Play funciona no aplicativo instalado. Aqui no navegador a
              ativação é apenas demonstrativa.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
