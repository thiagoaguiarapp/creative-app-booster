# Reativar Google AdSense no site (web)

O Google AdSense foi removido anteriormente quando o app migrou para o AdMob nativo do Capacitor. Agora o site também precisa exibir anúncios via AdSense, usando o script enviado (`ca-pub-2715745778380480`). O AdMob nativo continua no app Android/iOS.

## 1. Criar o inicializador do AdSense web

- Recriar `src/lib/adsense.ts` com:
  - Constante `ADSENSE_CLIENT = "ca-pub-2715745778380480"`.
  - Função `inicializarAdSense()` que injeta o script `adsbygoogle.js` no `<head>` apenas quando estiver em um navegador (não no app nativo do Capacitor).
  - Garantia de que o script seja inserido apenas uma vez por sessão.

## 2. Ativar o script em todas as páginas

- Criar `src/components/ad-sense-init.tsx`: componente sem renderização visual que chama `inicializarAdSense()` dentro de `useEffect`.
- Inserir `<AdSenseInit />` no layout raiz `src/routes/__root.tsx`, de modo que o script carregue no `<head>` de todas as rotas automaticamente.
- Como o script é injetado no cliente, não há impacto no SSR.

## 3. Preservar o AdMob nativo

- Não alterar `src/lib/admob.ts` nem `src/components/ad-banner-mobile.tsx`.
- O banner do AdMob continua aparecendo só no app Android/iOS para usuários Free.
- A verificação `Capacitor.isNativePlatform()` evita que o script do AdSense seja carregado no app nativo.

## 4. Ajustes de layout (se necessário)

- Verificar se o espaçamento inferior reservado para o banner do AdMob (`--altura-banner-ads`) precisa de alguma adaptação para a web. Inicialmente não muda, porque o AdSense ainda não tem blocos de anúncio posicionados — apenas o script global está sendo carregado.

## 5. Roadmap

- Atualizar `roadmap.md`:
  - Marcar "AdSense web reativado no site" como feito.
  - Manter pendente a troca dos IDs de teste do AdMob e a configuração nativa Android.

## Resultado esperado

- O site/publicação carrega o script do AdSense em todas as páginas.
- O app nativo continua usando o AdMob, sem conflitos.
