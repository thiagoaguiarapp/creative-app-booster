import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/testajunto/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — TestaJunto" },
      {
        name: "description",
        content:
          "Como o TestaJunto coleta, usa e protege os dados dos testadores, em conformidade com a LGPD.",
      },
      { property: "og:title", content: "Política de Privacidade — TestaJunto" },
      {
        property: "og:description",
        content: "Como o TestaJunto coleta, usa e protege os dados dos testadores.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TestaJuntoPrivacidade,
});

function TestaJuntoPrivacidade() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-4 md:p-8">
      <header>
        <h1 className="font-display text-2xl font-semibold uppercase tracking-wide sm:text-3xl">
          Política de Privacidade — TestaJunto
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Última atualização: 26 de outubro de 2026
        </p>
      </header>

      <section className="flex flex-col gap-4 text-sm leading-relaxed text-muted-foreground">
        <div>
          <h2 className="font-display text-base font-semibold text-foreground">1. Quem somos</h2>
          <p>
            O TestaJunto, da Rota Control, é uma plataforma colaborativa que ajuda desenvolvedores
            Android a cumprir o teste fechado da Google Play com testadores reais.
          </p>
        </div>

        <div>
          <h2 className="font-display text-base font-semibold text-foreground">2. Dados coletados</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Nome e e-mail do cadastro (ou da conta Google usada para entrar).</li>
            <li>
              Prints enviados no check-in diário, usados só para comprovar o teste; geramos uma
              impressão digital (hash) para impedir envio repetido.
            </li>
            <li>Histórico de testes, check-ins, créditos, reputação e campanhas.</li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-base font-semibold text-foreground">3. Uso dos dados</h2>
          <p>
            Usamos os dados para manter sua conta, validar os testes diários, conceder créditos,
            evitar fraudes e permitir a entrada no grupo oficial de testes.
          </p>
        </div>

        <div>
          <h2 className="font-display text-base font-semibold text-foreground">
            4. Compartilhamento
          </h2>
          <p>
            Não vendemos seus dados. O desenvolvedor de um app que você testa vê apenas o necessário
            para acompanhar a participação no teste.
          </p>
        </div>

        <div>
          <h2 className="font-display text-base font-semibold text-foreground">5. Anúncios</h2>
          <p>
            O app pode exibir anúncios opcionais com recompensa em créditos. Caso uma rede de anúncios
            seja usada, ela poderá coletar identificadores do dispositivo conforme a política dela.
          </p>
        </div>

        <div>
          <h2 className="font-display text-base font-semibold text-foreground">
            6. Segurança e exclusão
          </h2>
          <p>
            Os dados ficam em servidores com conexão criptografada e acesso restrito. Você pode pedir
            a exclusão da sua conta e de todos os dados pelo e-mail abaixo.
          </p>
        </div>

        <div>
          <h2 className="font-display text-base font-semibold text-foreground">7. Contato</h2>
          <p>
            E-mail:{" "}
            <a
              href="mailto:rotacontroladm@gmail.com"
              className="text-primary underline-offset-4 hover:underline"
            >
              rotacontroladm@gmail.com
            </a>
          </p>
        </div>
      </section>

      <Link to="/" className="text-sm text-primary underline-offset-4 hover:underline">
        Voltar ao início
      </Link>
    </div>
  );
}
