# Fluxo de caixa no painel admin

Nova aba **Fluxo de caixa** dentro de `/admin`, mostrando entradas e saídas organizadas por data, com totais de faturado, despesas e saldo do período.

## O que a tela mostra

1. **Filtro de período** (data inicial e final, começando no mês atual), igual ao da aba Relatórios.
2. **Três cards de totais**: Faturado (entradas), Despesas (saídas: abastecimento + despesa + manutenção) e Saldo (faturado − despesas), com destaque de cor quando o saldo é negativo.
3. **Lista por data** (mais recente primeiro): cada dia é uma linha/cartão com entradas do dia, saídas do dia e saldo do dia.
4. **Detalhe do dia**: ao expandir a data, aparecem os lançamentos individuais (tipo, categoria, valor), com sinal + para entrada e − para saída.
5. **Saldo acumulado** exibido ao lado de cada dia, para acompanhar a evolução do caixa dentro do período.
6. Layout mobile em cartões empilhados e tabela a partir de 1024px, seguindo o padrão já usado nas outras telas.

## Detalhes técnicos

- Novo arquivo `src/routes/admin.fluxo-caixa.tsx` com `createFileRoute("/admin/fluxo-caixa")`.
- Reutiliza `lancamentosGlobaisFn` (`src/lib/admin.functions.ts`) via `useQuery` + `useServerFn`, com a mesma `queryKey` `["admin-lancamentos"]` da aba Relatórios — sem novas funções de servidor nem mudanças no banco.
- Classificação: `ganho` = entrada; `abastecimento`, `despesa`, `manutencao` = saída; `repasse` fica fora do resultado (é recebimento de valor já faturado) e é apenas indicado como informação de caixa, para não duplicar o faturamento.
- Agrupamento por `iso` (data) com `useMemo`; formatação com `brl` e `dataBr`.
- Adiciona a aba na lista `ABAS` de `src/routes/admin.tsx`.
- Componentes existentes: `SectionCard`, `StatCard`, `Input`, `Label`, `Button`.
