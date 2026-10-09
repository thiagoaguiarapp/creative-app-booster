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
- Build the unified receivables list with `conciliacaoRecebimentos` and existing FIFO allocation so platform rows, summary totals, and settlement defaults share one calculation.
