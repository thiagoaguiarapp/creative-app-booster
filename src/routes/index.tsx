import { createFileRoute, Link } from "@tanstack/react-router";
import { Bike, FlaskConical, Rocket, Sparkles } from "lucide-react";

import { LandingFooter } from "@/components/landing-footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rota Control — Apps para quem vive na rua" },
      {
        name: "description",
        content:
          "Portal da Rota Control: conheça os aplicativos que estamos construindo, começando pelo No Corre, a gestão financeira do entregador.",
      },
      { property: "og:title", content: "Rota Control — Nossos apps" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      {
        property: "og:description",
        content:
          "Conheça os apps da Rota Control: No Corre (gestão financeira para entregadores) e os próximos lançamentos.",
      },
    ],
  }),
  component: Portal,
});

const APPS = [
  {
    icon: "/icon-192-v2.png",
    nome: "No Corre",
    status: "Disponível",
    statusClass: "bg-primary/15 text-primary",
    descricao:
      "Gestão financeira completa para entregadores: ganhos por plataforma, abastecimento, despesas, manutenção da moto e repasses.",
    acao: { rotulo: "Abrir o app", to: "/nocorre" as const, externo: false },
  },
  {
    icon: null,
    emoji: "🧪",
    nome: "TestaJunto",
    status: "Beta",
    statusClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    descricao:
      "Plataforma colaborativa para desenvolvedores Android conquistarem os 20 testadores por 14 dias exigidos pelo Google Play.",
    acao: {
      rotulo: "Conhecer o beta",
      to: "https://google-play-mate.lovable.app",
      externo: true,
    },
  },
  {
    icon: null,
    emoji: "🚀",
    nome: "Próximo app",
    status: "Em breve",
    statusClass: "bg-muted text-muted-foreground",
    descricao:
      "Estamos preparando a próxima ferramenta da família Rota Control. Volte em breve para conhecer.",
    acao: null,
  },
];

function Portal() {
  const { usuario } = Route.useRouteContext();
  return (
    <div className="flex min-h-svh flex-col">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-14 px-4 py-8 sm:py-12">
        {/* Topo */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Bike className="size-5" />
            </div>
            <span className="font-display text-lg font-semibold uppercase tracking-[0.14em]">
              Rota Control
            </span>
          </div>
          {usuario?.nome ? (
            <Button variant="ghost" asChild>
              <Link to="/inicio">Abrir o painel</Link>
            </Button>
          ) : usuario ? (
            <Button variant="ghost" asChild>
              <Link to="/perfil">Completar cadastro</Link>
            </Button>
          ) : (
            <Button variant="ghost" asChild>
              <Link to="/auth">Entrar no No Corre</Link>
            </Button>
          )}
        </header>

        {/* Hero */}
        <section className="flex flex-col items-center gap-5 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Sparkles className="size-7" />
          </div>
          <h1 className="max-w-2xl font-display text-4xl font-bold leading-tight sm:text-5xl">
            Apps feitos para quem vive na rua
          </h1>
          <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
            A Rota Control constrói ferramentas simples e úteis para o dia a dia
            de entregadores e desenvolvedores. Escolha um app abaixo para começar.
          </p>
        </section>

        {/* Apps */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {APPS.map((app) => (
            <div key={app.nome} className="panel flex flex-col gap-4 p-6">
              <div className="flex items-center justify-between">
                {app.icon ? (
                  <img src={app.icon} alt={`Ícone ${app.nome}`} className="size-14 rounded-2xl shadow" />
                ) : (
                  <span className="text-4xl" aria-hidden>{app.emoji}</span>
                )}
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${app.statusClass}`}>
                  {app.status}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <h2 className="font-display text-xl font-semibold">{app.nome}</h2>
                <p className="text-sm text-muted-foreground">{app.descricao}</p>
              </div>
              {app.acao ? (
                app.acao.externo ? (
                  <Button asChild className="mt-2">
                    <a href={app.acao.to} target="_blank" rel="noopener noreferrer">
                      <FlaskConical className="mr-1 size-4" /> {app.acao.rotulo}
                    </a>
                  </Button>
                ) : (
                  <Button asChild className="mt-2">
                    <Link to={app.acao.to}>
                      <Rocket className="mr-1 size-4" /> {app.acao.rotulo}
                    </Link>
                  </Button>
                )
              ) : (
                <Button disabled variant="outline" className="mt-2">
                  Em breve
                </Button>
              )}
            </div>
          ))}
        </section>

        {/* Rodapé institucional */}
        <section className="flex flex-col items-center gap-3 pb-6 text-center">
          <p className="max-w-md text-sm text-muted-foreground">
            Precisa de ajuda ou quer sugerir um app? Fale com a gente pela página
            de contato.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button variant="outline" asChild>
              <Link to="/contato">Contato</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/sobre">Sobre a Rota Control</Link>
            </Button>
          </div>
        </section>
      </div>
      <LandingFooter />
    </div>
  );
}
