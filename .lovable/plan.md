# Tela Banco (Pagamentos + Extrato)

A tela "Pagamentos" passa a se chamar **Banco**, com duas abas.

## Aba Pagamento
Exatamente o conteúdo atual da tela de pagamentos: cards de resumo, filtros
Mês atual / Mês passado / Total, participação por forma, histórico da fatura
do cartão, contas em aberto, lançamentos do período e os botões
"Nova despesa", "Lançar pagamento" e "Retirada pessoal".

## Aba Extrato (movimentação)
Lista única, em ordem de data (mais recente primeiro), de todo o dinheiro que
entrou e saiu, de todo o período:

- **Entradas**: recebimentos/repasses das plataformas e ganhos extras
  (gorjeta, sobra de troco).
- **Saídas**: despesas, abastecimentos e manutenções, na data em que o dinheiro
  sai (no crédito, a data de vencimento da parcela).

Cada linha mostra data, descrição, origem (ex.: Repasse, Despesa,
Abastecimento), forma de pagamento/recebimento e o valor, verde para entrada e
vermelho para saída. No topo: total de entradas, total de saídas e saldo do
que está sendo exibido, além de um saldo acumulado por linha.

**Busca personalizada**: um campo de pesquisa filtra por descrição, origem,
forma, data ou valor, sem diferenciar maiúsculas e acentos, com botão para
limpar. Junto dele, filtros rápidos de período (mês atual, mês passado, total)
e de tipo (tudo / só entradas / só saídas).

## Detalhes técnicos

- Nova rota `src/routes/banco.tsx` com abas (componente `Tabs` do shadcn),
  aba padrão "Pagamento".
- O conteúdo atual de `src/routes/pagamentos.tsx` vira um componente
  `AbaPagamento`; `/pagamentos` continua existindo como redirecionamento
  permanente para `/banco` para não quebrar links salvos.
- Novo módulo `src/lib/extrato.ts` com `montaExtrato(data)`, que reaproveita
  `montaPagamentos` (saídas) e a mesma leitura de repasses/extras usada em
  `src/lib/fluxo-caixa.ts` (entradas), devolvendo linhas normalizadas
  `{ id, iso, data, descricao, origem, forma, tipo: "entrada" | "saida", valor }`.
- Atalhos e menu: em `src/components/atalho-paginas.tsx` e
  `src/components/app-sidebar.tsx`, o item "Pagam." passa a "Banco"
  apontando para `/banco`.
- `head()` própria para `/banco` com título e descrição específicos.
- Testes rápidos do cálculo do extrato em `src/lib/__tests__`.
