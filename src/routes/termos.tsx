import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — Rota Control" },
      {
        name: "description",
        content:
          "Termos de Uso do Rota Control: regras de utilização do aplicativo de controle financeiro para entregadores.",
      },
      { property: "og:title", content: "Termos de Uso — Rota Control" },
      {
        property: "og:description",
        content: "Regras de utilização do Rota Control, aplicativo de controle financeiro para entregadores.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermosPage,
});

function TermosPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-4 md:p-8">
      <header>
        <h1 className="font-display text-2xl font-semibold uppercase tracking-wide sm:text-3xl">
          Termos de Uso
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Última atualização: {new Date().toLocaleDateString("pt-BR")}
        </p>
      </header>

      <section className="flex flex-col gap-4 text-sm leading-relaxed text-muted-foreground">
        <div>
          <h2 className="font-display text-base font-semibold text-foreground">1. Sobre o serviço</h2>
          <p>
            O Rota Control é um aplicativo de registro e acompanhamento financeiro voltado a
            entregadores e motoristas de aplicativo. Ele permite lançar ganhos, abastecimentos,
            despesas, manutenções e repasses, gerando relatórios a partir das informações que você
            mesmo informa.
          </p>
        </div>

        <div>
          <h2 className="font-display text-base font-semibold text-foreground">2. Conta de acesso</h2>
          <p>
            Para usar o aplicativo é necessário criar uma conta com e-mail válido. Você é responsável
            por manter a confidencialidade da sua senha e por todas as atividades realizadas na sua
            conta. Cada usuário só tem acesso aos próprios lançamentos.
          </p>
        </div>

        <div>
          <h2 className="font-display text-base font-semibold text-foreground">
            3. Responsabilidade sobre os dados
          </h2>
          <p>
            Os cálculos, gráficos e relatórios são gerados a partir dos dados informados por você. O
            Rota Control não é um serviço de contabilidade nem de assessoria fiscal e não substitui a
            orientação de um profissional. Confira sempre as informações antes de tomar decisões
            financeiras.
          </p>
        </div>

        <div>
          <h2 className="font-display text-base font-semibold text-foreground">4. Plano Premium</h2>
          <p>
            O aplicativo pode ser usado gratuitamente com exibição de anúncios. O plano Premium remove
            os anúncios e é cobrado de forma recorrente conforme o valor e a periodicidade informados
            no momento da contratação. O cancelamento pode ser solicitado a qualquer momento e passa a
            valer ao fim do período já pago, sem reembolso proporcional, salvo exigência legal.
          </p>
        </div>

        <div>
          <h2 className="font-display text-base font-semibold text-foreground">5. Uso adequado</h2>
          <p>
            É proibido utilizar o aplicativo para fins ilícitos, tentar acessar dados de outros
            usuários, sobrecarregar a infraestrutura ou realizar engenharia reversa do serviço. Contas
            que violem estas regras podem ser suspensas ou encerradas.
          </p>
        </div>

        <div>
          <h2 className="font-display text-base font-semibold text-foreground">
            6. Disponibilidade e alterações
          </h2>
          <p>
            O serviço é fornecido &quot;no estado em que se encontra&quot;. Podemos alterar
            funcionalidades, interromper temporariamente o acesso para manutenção ou atualizar estes
            Termos. Mudanças relevantes serão comunicadas dentro do aplicativo.
          </p>
        </div>

        <div>
          <h2 className="font-display text-base font-semibold text-foreground">7. Contato</h2>
          <p>
            Dúvidas sobre estes Termos podem ser enviadas pelo canal de suporte informado na tela de
            Configurações do aplicativo.
          </p>
        </div>
      </section>

      <Link to="/" className="text-sm text-primary underline-offset-4 hover:underline">
        Voltar ao início
      </Link>
    </div>
  );
}
