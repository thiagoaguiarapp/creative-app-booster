# Anúncios nativos com Capacitor AdMob

## O que existe hoje

O app tem apenas anúncios web (Google AdSense): `src/lib/adsense.ts` com IDs placeholder (`ca-pub-XXXXXXXXXXXXXXXX` / `YYYYYYYYYY`) e o componente `src/components/ad-banner.tsx`, usado na tela Início e no Relatório, já oculto para quem é Premium (`usuario.isPremium`).

Não existe nenhum SDK mobile instalado, nem pastas `android/` ou `ios/`, nem `capacitor.config.ts`.

## Importante antes de começar

O AdMob é um SDK **nativo**: ele só roda no aplicativo Android/iOS compilado, nunca no navegador nem no preview do Lovable. Para publicar na Play Store você precisará, no seu computador:

1. Exportar o projeto para o GitHub e clonar.
2. Rodar `npm install`, `npx cap add android`, `npx cap sync`.
3. Abrir no Android Studio e gerar o APK/AAB.

Eu preparo todo o código e a configuração aqui; a compilação final é feita na sua máquina. No preview e no site publicado, o app continua mostrando o banner AdSense normalmente.

## O que será construído

### 1. Camada de anúncios unificada

Um serviço `src/lib/ads.ts` que detecta se o app está rodando como aplicativo nativo ou no navegador:

- Nativo (Android/iOS) → AdMob (banner e interstitial).
- Navegador → mantém o AdSense atual, sem mudança.
- Premium → nenhum anúncio, em qualquer plataforma.

### 2. Banner inferior fixo

Banner ancorado no rodapé da tela em todo o app (não só na Início e no Relatório), com um espaçamento automático no conteúdo para o banner não cobrir a barra de navegação inferior do celular.

### 3. Interstitial preparado

Um interstitial que só aparece para usuários Free, com regras de bom senso para não irritar:

- Pré-carregado no início da sessão.
- Exibido depois de um lançamento salvo com sucesso.
- No máximo 1 a cada 3 minutos e limite diário.
- Nunca durante o preenchimento de formulários.

Eu já deixo o gatilho ativo após salvar um lançamento; podemos ajustar frequência depois.

### 4. IDs de bloco de anúncio

Começo com os IDs oficiais de **teste** do Google, para você validar sem risco de bloqueio da conta. Quando você criar os blocos reais no painel do AdMob, é só me passar os IDs (App ID Android, banner e interstitial) que eu troco.

## Detalhes técnicos

- Instalar `@capacitor/core`, `@capacitor/cli`, `@capacitor/android` e `@capacitor-community/admob`.
- Criar `capacitor.config.ts` com `appId` (ex.: `br.com.rotacontrolapp.app`), `appName` "Rota Control", `webDir` apontando para a saída do build e `server.url` para o preview durante o desenvolvimento.
- `src/lib/ads.ts`: `Capacitor.isNativePlatform()`, `AdMob.initialize()`, `showBanner` com `BannerAdPosition.BOTTOM_CENTER`, `prepareInterstitial` / `showInterstitial`, e constantes de IDs de teste (`ca-app-pub-3940256099942544/...`).
- `src/hooks/use-ads.ts`: inicializa o AdMob uma vez após a hidratação, lê `isPremium` do contexto da rota, e expõe `mostrarInterstitial()`.
- `src/components/ad-banner.tsx`: passa a renderizar o AdSense apenas na web; no nativo não renderiza nada (o banner é uma camada nativa sobre a WebView).
- `src/routes/__root.tsx`: monta o controlador de banner no layout autenticado e aplica o padding inferior quando o banner nativo está visível.
- `src/components/lancamento-form.tsx`: chama `mostrarInterstitial()` no `onSuccess`, respeitando o limitador de frequência.
- O import do `@capacitor-community/admob` será dinâmico, dentro de `useEffect`, para não quebrar o SSR.

## Roadmap

Vou criar/atualizar `roadmap.md` com esta tarefa e com o pendente de trocar os IDs de teste pelos IDs reais do AdMob.
