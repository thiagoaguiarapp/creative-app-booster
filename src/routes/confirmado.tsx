import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { confirmarSessaoFn } from "@/lib/auth.functions";

export const Route = createFileRoute("/confirmado")({
  head: () => ({
    meta: [
      { title: "E-mail confirmado — Rota Control" },
      {
        name: "description",
        content: "Confirmação de e-mail da sua conta do Rota Control.",
      },
      { property: "og:title", content: "E-mail confirmado — Rota Control" },
      {
        property: "og:description",
        content: "Confirmação de e-mail da sua conta do Rota Control.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ConfirmadoPage,
});

type Estado = "verificando" | "ok" | "erro";

function ConfirmadoPage() {
  const router = useRouter();
  const confirmar = useServerFn(confirmarSessaoFn);
  const [estado, setEstado] = useState<Estado>("verificando");
  const [mensagem, setMensagem] = useState("Confirmando seu e-mail…");

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const busca = new URLSearchParams(window.location.search);
    const erro = hash.get("error_description") ?? busca.get("error_description");
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token") ?? "";

    if (erro) {
      setEstado("erro");
      setMensagem("O link expirou ou já foi usado. Peça um novo e-mail de confirmação.");
      return;
    }
    if (!accessToken) {
      setEstado("erro");
      setMensagem("Abra esta página pelo link enviado no seu e-mail.");
      return;
    }

    void (async () => {
      try {
        await confirmar({ data: { accessToken, refreshToken } });
        setEstado("ok");
        setMensagem("E-mail confirmado! Bem-vindo ao Rota Control.");
        await router.invalidate();
        router.navigate({ to: "/", replace: true });
      } catch (err) {
        setEstado("erro");
        setMensagem(
          err instanceof Error
            ? err.message
            : "Não foi possível confirmar o e-mail. Peça um novo link.",
        );
      }
    })();
  }, [confirmar, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 text-center shadow-sm">
        <img
          src="/icon-192-v2.png"
          alt="Rota Control"
          className="mx-auto size-14 rounded-lg object-cover"
        />
        <h1 className="mt-3 font-display text-2xl font-semibold uppercase tracking-wide">
          {estado === "ok" ? "Tudo certo!" : "Confirmação de e-mail"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{mensagem}</p>
        {estado === "erro" && (
          <Button className="mt-5 w-full" onClick={() => router.navigate({ to: "/auth" })}>
            Voltar para o login
          </Button>
        )}
      </div>
    </div>
  );
}
