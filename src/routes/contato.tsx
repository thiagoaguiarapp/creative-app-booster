import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Clock, HelpCircle, Mail, MessageCircle } from "lucide-react";

import { LandingFooter } from "@/components/landing-footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato e suporte — No Corre" },
      {
        name: "description",
        content:
          "Fale com a equipe do No Corre: suporte por e-mail, dúvidas sobre o aplicativo, assinatura Premium e sugestões de melhoria.",
      },
      { property: "og:title", content: "Contato e suporte — No Corre" },
      {
        property: "og:description",
        content: "Fale com a equipe do No Corre: suporte, dúvidas e sugestões.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Contato,
});

const PERGUNTAS = [
  {
    pergunta: "O No Corre é grátis?",
    resposta:
      "Sim. O plano gratuito já inclui lançamentos de ganhos, abastecimento, despesas, manutenção e relatórios. O plano Premium remove os anúncios e libera recursos extras.",
  },
  {
    pergunta: "Meus dados ficam salvos se eu trocar de celular?",
    resposta:
      "Sim. Todos os dados ficam na sua conta na nuvem. Basta instalar o app no novo aparelho e entrar com o mesmo e-mail e senha.",
  },
  {
    pergunta: "Como cancelo a assinatura Premium?",
    resposta:
      "A assinatura é gerenciada pela Google Play: abra a Play Store, toque no seu perfil, vá em Pagamentos e assinaturas e cancele quando quiser. O acesso Premium continua até o fim do período pago.",
  },
  {
    pergunta: "Esqueci minha senha. O que faço?",
    resposta:
      "Na tela de entrada, toque em \"Esqueci minha senha\" e informe seu e-mail. Você receberá um link para definir uma nova senha.",
  },
];

function Contato() {
  return (
    <div className="flex min-h-svh flex-col">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-8 sm:py-12">
        <header className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="mr-1 size-4" /> Voltar
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/auth">Criar conta grátis</Link>
          </Button>
        </header>

        <section className="flex flex-col gap-4">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Contato e suporte</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Tem alguma dúvida, sugestão ou encontrou um problema no aplicativo? Fale com a gente.
            Respondemos todas as mensagens.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="panel flex flex-col gap-3 p-5">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Mail className="size-5" />
            </div>
            <h2 className="font-semibold">E-mail</h2>
            <p className="text-sm text-muted-foreground">
              Para suporte, dúvidas sobre assinatura ou parcerias:
            </p>
            <a
              href="mailto:suporte@rotacontrolapp.com.br"
              className="text-sm font-medium text-primary hover:underline"
            >
              suporte@rotacontrolapp.com.br
            </a>
          </div>
          <div className="panel flex flex-col gap-3 p-5">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Clock className="size-5" />
            </div>
            <h2 className="font-semibold">Tempo de resposta</h2>
            <p className="text-sm text-muted-foreground">
              Respondemos em até 2 dias úteis. Mensagens sobre problemas de acesso ou cobrança têm
              prioridade.
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="size-5 text-primary" />
            <h2 className="font-display text-2xl font-semibold">Perguntas frequentes</h2>
          </div>
          <div className="flex flex-col gap-3">
            {PERGUNTAS.map((p) => (
              <div key={p.pergunta} className="panel flex flex-col gap-2 p-5">
                <h3 className="font-semibold">{p.pergunta}</h3>
                <p className="text-sm text-muted-foreground">{p.resposta}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="panel flex items-start gap-3 p-5">
          <MessageCircle className="mt-0.5 size-5 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">
            Antes de escrever, confira também o{" "}
            <Link to="/tour" className="text-primary hover:underline">tour pelo app</Link> e o{" "}
            <Link to="/blog" className="text-primary hover:underline">blog</Link> — muitas dúvidas
            do dia a dia já estão respondidas lá.
          </p>
        </section>
      </div>
      <LandingFooter />
    </div>
  );
}
