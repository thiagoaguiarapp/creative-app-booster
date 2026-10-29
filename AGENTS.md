<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Reuse `RepassesContent` in the Repasses route and Financeiro tab, with an optional shared date interval, to preserve a single implementation of reconciliation and editing actions.
- Keep expense-to-maintenance recognition and existing-plan selection in `manutencao-link.ts` so the form and tests share the same normalized matching rules.
- Build the unified receivables list with `conciliacaoRecebimentos` and existing FIFO allocation so platform rows, summary totals, and settlement defaults share one calculation.
- Open external links from the native app by navigating the current window, not `window.open(..., "_blank")`: Capacitor's Android WebView never creates a second window, so the click is silently dropped. Keep an https fallback for devices without the store app.
- All AdMob banners (Home included) share the single rodapé unit, passed through the shared native banner controller; do not reintroduce per-route units without a new Banner-format ad unit.
- The native banner must never cover a popup layer: any overlay that renders in a portal (select lists, menus) has to pause the banner while open and resume it on close, and full-screen dialogs must reserve `--altura-banner-ads` in their footer so action buttons stay visible.

- Use `resumoSemanaPorDia` and `totaisSemana` for the Home weekly summary and its detail page so daily amounts and weekly totals cannot diverge.
- This project serves only the No Corre app, on its own subdomain (`nocorre.rotacontrolapp.com.br`): `/` is No Corre's public landing and the native entry point, while the Rota Control company portal lives at `/portal` purely as a copy until the company site gets its own project and domain. Keep `capacitor.config.ts` pointed at this project's own published address — never at another app's URL or an outside deployment — so each Rota Control app stays isolated in its own box and installed apps always load the version published here.
- Resolve signed-in entry redirects with the shared pure `destinoEntradaApp` helper in root `beforeLoad`, before the network-failure return, so SSR and cached-session startup do not depend on Capacitor detection.
- Notification icons are Android drawables referenced by filename (`smallIcon`/`largeIcon` in `capacitor.config.ts` and in each schedule call): a wrong name silently falls back to the system glyph, so keep the names, the files under `android/app/src/main/res/drawable-*dpi/`, and `src/lib/__tests__/icones-notificacao.test.ts` in sync.
- Keep the `entities/decode` and `entities/escape` entries in `vite.config.ts` `resolve.alias` (and the matching `tsconfig.json` paths): the pinned `entities@4.5.0` only exposes `entities/lib/decode.js`, so when npm installs a newer `htmlparser2` the build dies with "Could not load node_modules/entities/decode" without them.
