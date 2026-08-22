import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import logoAsset from "@/assets/logo.png.asset.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { redefinirSenhaFn } from "@/lib/auth.functions";

export const Route = createFileRoute("/redefinir-senha")({
  head: () => ({
    meta: [
      { title: "Redefinir senha — Rota Control" },
      {
        name: "description",
        content: "Crie uma nova senha para voltar a acessar sua conta do Rota Control.",
      },
      { property: "og:title", content: "Redefinir senha — Rota Control" },
      {
        property: "og:description",
        content: "Crie uma nova senha para voltar a acessar sua conta do Rota Control.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RedefinirSenhaPage,
});

function RedefinirSenhaPage() {
  const router = useRouter();
  const redefinir = useServerFn(redefinirSenhaFn);

  const [token, setToken] = useState<string | null>(null);
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const t = hash.get("access_token");
    if (t) setToken(t);
  }, []);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("Link inválido ou expirado. Peça um novo e-mail de recuperação.");
      return;
    }
    if (senha.length < 6) {
      toast.error("A senha precisa ter ao menos 6 caracteres.");
      return;
    }
    if (senha !== confirmar) {
      toast.error("As senhas não conferem.");
      return;
    }
    setCarregando(true);
    try {
      await redefinir({ data: { accessToken: token, senha } });
      toast.success("Senha alterada! Você já está conectado.");
      await router.invalidate();
      router.navigate({ to: "/", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível alterar a senha.");
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
            Nova senha
          </h1>
          <p className="text-sm text-muted-foreground">
            {token
              ? "Defina a nova senha da sua conta"
              : "Abra esta página pelo link enviado no seu e-mail"}
          </p>
        </div>

        <form className="mt-6 flex flex-col gap-4" onSubmit={enviar}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="senha">Nova senha</Label>
            <Input
              id="senha"
              type="password"
              autoComplete="new-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Mínimo de 6 caracteres"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmar">Confirmar senha</Label>
            <Input
              id="confirmar"
              type="password"
              autoComplete="new-password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              placeholder="Repita a nova senha"
            />
          </div>
          <Button type="submit" disabled={carregando || !token}>
            {carregando ? "Salvando…" : "Salvar nova senha"}
          </Button>
        </form>

        <button
          type="button"
          className="mt-4 w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
          onClick={() => router.navigate({ to: "/auth" })}
        >
          Voltar para o login
        </button>
      </div>
    </div>
  );
}
