import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import logoAsset from "@/assets/logo.png.asset.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cadastrarFn, entrarFn } from "@/lib/auth.functions";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Rota Control" },
      {
        name: "description",
        content:
          "Acesse sua conta do Rota Control para controlar ganhos, gastos e repasses das suas entregas.",
      },
      { property: "og:title", content: "Entrar — Rota Control" },
      {
        property: "og:description",
        content:
          "Acesse sua conta do Rota Control para controlar ganhos, gastos e repasses das suas entregas.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const router = useRouter();
  const entrar = useServerFn(entrarFn);
  const cadastrar = useServerFn(cadastrarFn);

  const [modo, setModo] = useState<"entrar" | "cadastrar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || senha.length < 6) {
      toast.error("Informe o e-mail e uma senha com pelo menos 6 caracteres.");
      return;
    }
    setCarregando(true);
    try {
      if (modo === "entrar") {
        await entrar({ data: { email, senha } });
      } else {
        const { logado } = await cadastrar({ data: { email, senha } });
        if (!logado) {
          toast.success("Conta criada! Confirme o e-mail para entrar.");
          setModo("entrar");
          return;
        }
      }
      await router.invalidate();
      router.navigate({ to: "/", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível continuar.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center gap-2 text-center">
          <img src={logoAsset.url} alt="Rota Control" className="size-14 rounded-lg object-cover" />
          <h1 className="font-display text-2xl font-semibold uppercase tracking-wide">
            Rota Control
          </h1>
          <p className="text-sm text-muted-foreground">
            {modo === "entrar" ? "Entre para ver seus lançamentos" : "Crie sua conta gratuita"}
          </p>
        </div>

        <form className="mt-6 flex flex-col gap-4" onSubmit={enviar}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              autoComplete={modo === "entrar" ? "current-password" : "new-password"}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Mínimo de 6 caracteres"
            />
          </div>
          <Button type="submit" disabled={carregando}>
            {carregando ? "Aguarde…" : modo === "entrar" ? "Entrar" : "Criar conta"}
          </Button>
        </form>

        <button
          type="button"
          className="mt-4 w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
          onClick={() => setModo(modo === "entrar" ? "cadastrar" : "entrar")}
        >
          {modo === "entrar" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
        </button>
      </div>
    </div>
  );
}
