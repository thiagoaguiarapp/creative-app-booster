import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — Rota Control" },
      {
        name: "description",
        content:
          "Como o Rota Control coleta, usa e protege os dados dos entregadores, em conformidade com a LGPD.",
      },
      { property: "og:title", content: "Política de Privacidade — Rota Control" },
      {
        property: "og:description",
        content: "Como o Rota Control coleta, usa e protege seus dados, em conformidade com a LGPD.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacidadePage,
});

function PrivacidadePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-4 md:p-8">
      <header>
        <h1 className="font-display text-2xl font-semibold uppercase tracking-wide sm:text-3xl">
          Política de Privacidade
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Última atualização: {new Date().toLocaleDateString("pt-BR")}
        </p>
      </header>

      <section className="flex flex-col gap-4 text-sm leading-relaxed text-muted-foreground">
        <div>
          <h2 className="font-display text-base font-semibold text-foreground">
            1. Dados que coletamos
          </h2>
          <p>
            Coletamos apenas o necessário para o funcionamento do aplicativo: e-mail e nome de
            cadastro, além dos lançamentos que você registra (ganhos, abastecimentos, despesas,
            manutenções, repasses, veículos e metas). Não coletamos dados de localização em tempo real
            nem acessamos suas contas nos aplicativos de entrega.
          </p>
        </div>

        <div>
          <h2 className="font-display text-base font-semibold text-foreground">2. Como usamos</h2>
          <p>
            Seus dados são usados para autenticar o acesso, exibir seus relatórios e indicadores,
            enviar e-mails essenciais de conta (confirmação de cadastro e redefinição de senha) e
            controlar o status do plano Premium.
          </p>
        </div>

        <div>
          <h2 className="font-display text-base font-semibold text-foreground">
            3. Isolamento e segurança
          </h2>
          <p>
            Cada conta acessa exclusivamente os próprios registros. O banco de dados aplica políticas
            de segurança em nível de linha (RLS), de modo que uma conta não consegue ler nem alterar
            os lançamentos de outra. As senhas são armazenadas de forma criptografada pelo provedor de
            autenticação e nunca ficam visíveis para nós.
          </p>
        </div>

        <div>
          <h2 className="font-display text-base font-semibold text-foreground">
            4. Compartilhamento com terceiros
          </h2>
          <p>
            Não vendemos seus dados. Utilizamos prestadores de serviço apenas para hospedagem, banco de
            dados, envio de e-mails transacionais, exibição de anúncios na versão gratuita e
            processamento de pagamentos do plano Premium — cada um recebe somente o mínimo necessário
            para executar sua função.
          </p>
        </div>

        <div>
          <h2 className="font-display text-base font-semibold text-foreground">
            5. Seus direitos (LGPD)
          </h2>
          <p>
            Você pode solicitar a qualquer momento o acesso, a correção, a portabilidade ou a exclusão
            dos seus dados, bem como o encerramento da conta. Ao excluir a conta, os lançamentos
            vinculados a ela são removidos.
          </p>
        </div>

        <div>
          <h2 className="font-display text-base font-semibold text-foreground">6. Retenção</h2>
          <p>
            Mantemos seus dados enquanto a conta estiver ativa. Após a exclusão, eles são eliminados,
            ressalvadas as informações que precisem ser conservadas por obrigação legal.
          </p>
        </div>

        <div>
          <h2 className="font-display text-base font-semibold text-foreground">7. Contato</h2>
          <p>
            Para exercer seus direitos ou tirar dúvidas sobre privacidade, utilize o canal de suporte
            informado na tela de Configurações do aplicativo.
          </p>
        </div>
      </section>

      <Link to="/" className="text-sm text-primary underline-offset-4 hover:underline">
        Voltar ao início
      </Link>
    </div>
  );
}
