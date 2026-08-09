import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { salvarPerfilFn } from "@/lib/auth.functions";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Completar perfil — Rota Control" },
      {
        name: "description",
        content: "Informe seu nome e telefone para personalizar o Rota Control.",
      },
      { property: "og:title", content: "Completar perfil — Rota Control" },
      {
        property: "og:description",
        content: "Informe seu nome e telefone para personalizar o Rota Control.",
      },
    ],
  }),
  component: PerfilPage,
});

function PerfilPage() {
  const router = useRouter();
  const { usuario } = Route.useRouteContext();
  const salvar = useServerFn(salvarPerfilFn);

  const [nome, setNome] = useState(usuario?.nome ?? "");
  const [telefone, setTelefone] = useState(usuario?.telefone ?? "");
  const [carregando, setCarregando] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nome.trim().length < 2) {
      toast.error("Informe seu nome completo (ou como quer ser chamado).");
      return;
    }
    setCarregando(true);
    try {
      await salvar({ data: { nome, telefone } });
      await router.invalidate();
      router.navigate({ to: "/", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar o perfil.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm">
        <h1 className="font-display text-2xl font-semibold uppercase tracking-wide">
          Completar perfil
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Só falta isso para começar a usar o Rota Control.
        </p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={enviar}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nome">Nome completo</Label>
            <Input
              id="nome"
              value={nome}
              maxLength={80}
              autoComplete="name"
              onChange={(e) => setNome(e.target.value)}
              placeholder="Como você quer ser chamado"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="telefone">WhatsApp / Telefone (opcional)</Label>
            <Input
              id="telefone"
              value={telefone}
              maxLength={20}
              inputMode="tel"
              autoComplete="tel"
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(11) 90000-0000"
            />
          </div>
          <Button type="submit" disabled={carregando}>
            {carregando ? "Salvando…" : "Salvar e continuar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
