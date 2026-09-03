# Trocar AdSense web por AdMob nativo (Capacitor)

Seguindo exatamente os quatro passos pedidos.

## 1. Remover a integração web do AdSense

- Apagar `src/lib/adsense.ts` (constantes `ADSENSE_CLIENT`, `ADSENSE_SLOT_PADRAO` e o carregador do script).
- Apagar o componente atual `src/components/ad-banner.tsx`.
- Remover as chamadas `<AdBanner />` e os imports em `src/routes/index.tsx` e `src/routes/relatorio.tsx`.

## 2. Instalar e configurar o Capacitor + AdMob

- Instalar `@capacitor/core`, `@capacitor/cli`, `@capacitor/android` e `@capacitor-community/admob`.
- Criar `capacitor.config.ts` com:
  - `appId`: `br.com.rotacontrolapp.app`
  - `appName`: `Rota Control`
  - `webDir`: pasta de saída do build
  - `server.url` apontando para o preview, para testar o app no celular sem recompilar a cada mudança.

## 3. Novo componente de banner AdMob (só para Free)

- `src/lib/admob.ts`: inicialização do AdMob, `mostrarBanner()` e `esconderBanner()`, com os IDs oficiais de **teste** do Google como valor inicial (troco pelos seus IDs reais quando você criar os blocos no painel).
- `src/components/ad-banner-mobile.tsx`: componente que lê `usuario.isPremium` do contexto da rota e:
  - Premium → não mostra nada e remove o banner se estiver ativo.
  - Free → inicializa o AdMob e exibe o banner ancorado na parte inferior.
  - Fora do app nativo (navegador/preview) → não faz nada.
- Montado uma única vez no layout autenticado em `src/routes/__root.tsx`, com um espaçamento inferior no conteúdo para o banner não cobrir a barra de navegação.
- Import do plugin feito de forma dinâmica dentro de `useEffect`, para não quebrar a renderização no servidor.

## 4. Pastas nativas do Android

O comando que cria a pasta `android/` (`npx cap add android`) precisa do Android SDK e roda na sua máquina — não é possível gerá-la aqui no Lovable. O que eu deixo pronto:

- `capacitor.config.ts` já configurado.
- Scripts no `package.json`: `cap:add`, `cap:sync`, `cap:open`.
- Instruções no `roadmap.md` com a sequência exata: exportar para o GitHub → `git pull` → `npm install` → `npx cap add android` → `npx cap sync` → `npx cap open android` → gerar o APK/AAB no Android Studio.
- Também documento onde colar o **AdMob App ID** no `AndroidManifest.xml` depois que a pasta for criada, já que esse arquivo só existe após o `cap add`.

## Efeito colateral a confirmar

Com o AdSense removido, o app no navegador e o site publicado ficam **sem nenhum anúncio** — a monetização passa a existir só no app Android instalado. Se preferir manter o AdSense na web em paralelo, me avise e eu mantenho os dois caminhos.

## Roadmap

Crio o `roadmap.md` com: migração para AdMob, troca dos IDs de teste pelos reais, geração da pasta Android na sua máquina e suporte a interstitial como próxima etapa.
