# Roadmap — Rota Control

## Ajustes do Financeiro
- [x] Integrar repasses no Financeiro mantendo conciliação e ações existentes.
- [x] Mostrar o gráfico de evolução acima das listagens por período.
- [x] Incluir Todos os lançamentos no Perfil para edição.
- [x] Recolher a gaveta "Buscar e filtrar" por padrão, com lupa e indicador de filtros ativos.
- [x] Gráfico de evolução abaixo dos cards de valores, e fora da aba Repasses e a receber.
- [x] Remover a lupa (Buscar e filtrar) e a aba Repasses e a receber do Financeiro.

## Anúncios

- [x] Reativar Google AdSense no site (web) para usuários Free (`ca-pub-2715745778380480`).
- [x] Usuários Premium não veem anúncios no site (mesma regra do app nativo).
- [x] Instalar Capacitor (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`) e `@capacitor-community/admob`.
- [x] Criar `capacitor.config.ts` (appId `br.com.rotacontrolapp.app`).
- [x] Banner AdMob inferior exibido apenas para usuários Free (`src/components/ad-banner-mobile.tsx`).
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

- [x] App Android abria a tela de login do Lovable: `capacitor.config.ts` agora aponta para `https://www.rotacontrolapp.com.br`.
- [x] Substituir o ícone padrão do Android pelo ícone oficial do Rota Control em todas as densidades.
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
