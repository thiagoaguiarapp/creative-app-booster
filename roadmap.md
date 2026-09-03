# Roadmap — Rota Control

## Anúncios (AdMob)

- [x] Remover a integração web do Google AdSense (`src/lib/adsense.ts`, `AdBanner`).
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

## Outros pendentes

- [ ] Domínio de e-mail `notify.rotacontrolapp.com.br` aguardando validação de DNS.
- [ ] Definir provedor de pagamento do plano Premium.
