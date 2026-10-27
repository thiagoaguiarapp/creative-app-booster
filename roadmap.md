# Roadmap — Rota Control

## Reconhecimento de manutenção na despesa
- [x] Ampliar reconhecimento pela categoria e descrição, ignorando acentos e maiúsculas, reutilizando planos existentes; 27 testes passaram.
- [ ] Conferir despesa → manutenção com dados reais (sem sessão autenticada disponível no ambiente).

## Relatório
- [x] Cards de Faturamento, Custo total, Combustível e Manutenção abrem gaveta com a origem do valor; lista completa só Premium, Free vê prévia de 3 com convite.
- [ ] Conferir a gaveta de detalhes com dados reais na sessão do usuário (sem sessão autenticada disponível no ambiente de teste).

## Detalhes da semana
- [x] Abrir uma subtela pelo botão Detalhes da Início com faturamento e gastos por dia, mantendo os totais do resumo (4 testes passaram).
- [ ] Conferir a subtela com dados reais na sessão do usuário (sem sessão autenticada disponível no ambiente de teste).

## Ajustes do Financeiro
- [x] Abrir Recebimento/Repasse em Total, mostrando a divisão de pendências apenas ao filtrar por período.
- [x] Unificar total a receber e incluir plataformas com pendências antigas na conciliação e em Dar baixa.
- [x] Integrar repasses no Financeiro mantendo conciliação e ações existentes.
- [x] Mostrar o gráfico de evolução acima das listagens por período.
- [x] Incluir Todos os lançamentos no Perfil para edição.
- [x] Recolher a gaveta "Buscar e filtrar" por padrão, com lupa e indicador de filtros ativos.
- [x] Gráfico de evolução abaixo dos cards de valores, e fora da aba Repasses e a receber.
- [x] Remover a lupa (Buscar e filtrar) e a aba Repasses e a receber do Financeiro.

## Login e conta

- [x] Botão de olho para mostrar/ocultar a senha no login, no cadastro e na nova senha.

## Anúncios

- [x] Configurar bloco Android específico do Início, preservando o banner das demais telas e a isenção Premium.
- [x] Reativar Google AdSense no site (web) para usuários Free (`ca-pub-2715745778380480`).
- [x] Usuários Premium não veem anúncios no site (mesma regra do app nativo).
- [x] Instalar Capacitor (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`) e `@capacitor-community/admob`.
- [x] Criar `capacitor.config.ts` (appId `br.com.rotacontrolapp.app`).
- [x] Banner AdMob inferior exibido apenas para usuários Free (`src/components/ad-banner-mobile.tsx`).
- [x] Banner sai da tela enquanto uma lista de opções está aberta, para não cobrir "Forma de pagamento" (`src/lib/admob.ts`, `src/components/ui/select.tsx`).

- [ ] Gerar a pasta nativa `android/` na máquina local (requer Android SDK — ver abaixo).
- [ ] Trocar os IDs de teste do AdMob pelos IDs reais dos blocos de anúncio.
- [ ] Ativar o interstitial para o plano Free (funções já prontas em `src/lib/admob.ts`).

## Como gerar o app Android

Os comandos abaixo rodam no seu computador, com Node e Android Studio instalados:

1. Exportar o projeto para o GitHub e clonar (ou `git pull`).
2. `npm install`
3. `npm run cap:add` — cria a pasta `android/`.
4. `npm run cap:sync`
5. `npm run cap:open` — abre o Android Studio para gerar o APK/AAB.

### AdMob App ID no Android

Depois do passo 3, abra `android/app/src/main/AndroidManifest.xml` e adicione dentro de `<application>`:

```xml
<meta-data
  android:name="com.google.android.gms.ads.APPLICATION_ID"
  android:value="ca-app-pub-3940256099942544~3347511713" />
```

O valor acima é o App ID de **teste**. Troque pelo App ID real do seu painel do AdMob antes de publicar.

## Premium (Google Play)

- [x] Tela `/premium` com benefícios, preço, "Assinar agora" e "Restaurar compras".
- [x] Plugin `@revenuecat/purchases-capacitor` integrado em `src/lib/iap.ts`.
- [ ] Criar a assinatura mensal na Google Play Console (produto `rota_control_premium_mensal`).
- [ ] Criar o entitlement `premium` no RevenueCat e definir `VITE_REVENUECAT_ANDROID_KEY`.

## Outros pendentes

- [x] App Android abria a tela de login do Lovable: `capacitor.config.ts` agora aponta para `https://nocorre.rotacontrolapp.com.br`.
- [x] Substituir o ícone padrão do Android pelo ícone oficial do Rota Control em todas as densidades.
- [x] Botão "Atualizar agora" do aviso de atualização não abria a Play Store: o app agora abre a loja direto (com a página web como reserva).
- [ ] Ajustar "Último custo" na tela Manutenção (ignorar reparo sem custo; incluir preventivo/corretivo).
- [ ] Domínio de e-mail `notify.rotacontrolapp.com.br` aguardando validação de DNS.

## Página inicial pública (web)
- [x] Landing em `/` só na web, apresentando o app; Android continua na tela de login.
- [x] Painel movido para `/inicio`; menus e redirecionamentos atualizados.
- [x] Bloco de anúncio AdSense na landing (só visitantes; falta criar o bloco no painel do AdSense e colar o ID em `ADSENSE_SLOT_LANDING`).

- [x] Moto do menu afastada do relógio; botão Sair movido para Configurações
- [x] Relatório: tabelas contidas na largura do celular

- [x] Remover tela Ganhos Diários
- [x] Lançamento rápido por app na Início (com baixa em dinheiro/Pix)
- [x] Início: card mostra "Faturado hoje" e rótulo "Saldo líquido do dia"
- [x] Início: botão de repasse rotulado "Adiantamento / Repasse" (duas linhas, cabe no celular)
- [x] Menu lateral do site: item "Entregas" abrindo a tela de entregas
- [x] Entregas: card "Faturado" maior que os demais, com o valor por extenso (sem cortar)
- [x] Entregas: opção "Personalizado" para buscar por intervalo de datas específico
- [x] Lançamento de ganho: Faturamento antes de Rotas/corridas; corridas por último (formulário e lançamento rápido)
- [x] Manutenção: botões Atualizar/Excluir em linha própria, sem cobrir o nome do serviço
- [ ] Redesenho visual da Início (etapa 3)

- [x] Pré-cadastro em etapas para novos usuários (veículo, apps, meta)

## Aprovação do AdSense (conteúdo público)

- [x] Página Sobre Nós (/sobre).
- [x] Página Contato e Suporte com FAQ (/contato).
- [x] Blog com 4 artigos originais para entregadores (/blog e /blog/:slug).
- [x] Tour pelo app (/tour).
- [x] Calculadora pública de custo por km (/calculadora).
- [x] Rodapé com links para todas as páginas públicas na landing.
- [ ] Publicar o site e reenviar para revisão no Google AdSense.

- [x] Simplificar tela Recebimento/Repasse: sem cards Faturado/Recebido, conciliação única com Dar baixa, detalhes recolhidos
- [x] Notificação no celular de manutenção vencida/próxima (versão 1.0.6 build 7)

## Offline
- [x] Nível 2: fila de lançamentos sem internet, cópia local dos dados e sessão.
- [ ] Abrir o app do zero sem internet (exige página guardada no aparelho / novo AAB).

## Subdomínio próprio por app
- [x] Preparar próximo AAB como versão 1.0.11, código 12; aviso de versão publicada permanece inalterado até a disponibilidade na loja.
- [x] Preparar AAB seguinte como versão 1.0.12, código 13 (teste `versao-aab.test.ts` atualizado).
- [x] Conta conectada em `/` e `/nocorre` abre Início (ou Perfil incompleto), inclusive no carregamento inicial sem identificação nativa; regra coberta por testes.
- [x] `nocorre.rotacontrolapp.com.br` conectado e ativo neste projeto (domínio primário).
- [x] `/` passou a ser a página do No Corre; portal da Rota Control movido para `/portal`; `/nocorre` redireciona para `/`.
- [x] `capacitor.config.ts` aponta para `https://nocorre.rotacontrolapp.com.br` (app instalado hoje ainda abre o site antigo em Vercel — precisa de novo AAB).
- [x] Link de recuperação de senha usa o endereço de origem em vez do domínio antigo.
- [ ] Gerar novo AAB com o endereço do subdomínio e enviar à Play Store.
- [ ] Portal da Rota Control em projeto e domínio próprios (`rotacontrolapp.com.br`, hoje apontando para Vercel).
- [ ] TestaJunto com subdomínio próprio (`testajunto.rotacontrolapp.com.br`) no projeto dele.
