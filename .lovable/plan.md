# Tela Banco (Pagamento, Extrato e Cartão)

A tela "Pagamentos" passa a se chamar **Banco**, com três abas.

## Aba Pagamento
Exatamente o conteúdo atual da tela de pagamentos: cards de resumo, filtros
Mês atual / Mês passado / Total, participação por forma, histórico da fatura
do cartão, contas em aberto, lançamentos do período e os botões
"Nova despesa", "Lançar pagamento" e "Retirada pessoal".

## Aba Extrato (movimentação em dinheiro)
Só o dinheiro que realmente circula na conta/carteira: **Dinheiro, Pix e
débito**. Nada de cartão de crédito aqui.

- **Entradas**: recebimentos/repasses das plataformas e ganhos extras
  (gorjeta, sobra de troco).
- **Saídas**: despesas, abastecimentos e manutenções pagos em dinheiro, Pix ou
  débito, na data em que o dinheiro saiu.

Lista única em ordem de data (mais recente primeiro), de todo o período. Cada
linha mostra data, descrição, origem (Repasse, Despesa, Abastecimento…), forma
e o valor — verde para entrada, vermelho para saída — com saldo acumulado. No
topo: total de entradas, total de saídas e saldo do que está sendo exibido.

**Busca personalizada**: campo de pesquisa que filtra por descrição, origem,
forma, data ou valor, sem diferenciar maiúsculas e acentos, com botão para
limpar. Junto dele, filtros rápidos de período (mês atual, mês passado, total)
e de tipo (tudo / entradas / saídas).

## Aba Cartão
Tudo o que foi gasto no cartão de crédito, à vista ou parcelado.

- Campo para informar o **limite total do cartão** e o **dia de vencimento**
  da fatura, salvos no seu perfil (ficam guardados entre acessos).
- **Barra de limite**: mostra quanto do limite já está comprometido (soma das
  parcelas ainda não pagas) e quanto ainda está livre; muda de cor ao passar
  de 70% e de 90%.
- Cards: limite total, usado, disponível, fatura do mês atual e próxima fatura.
- **Faturas por mês de vencimento**, expansíveis, listando as compras/parcelas
  de cada fatura, com marca de vencida/paga e o botão de dar baixa que já
  existe hoje.
- Busca por descrição/categoria também nesta aba.

## Detalhes técnicos

- Nova rota `src/routes/banco.tsx` com `Tabs` (shadcn); aba padrão "Pagamento",
  aba lembrada na URL (`?aba=extrato`).
- O conteúdo atual de `src/routes/pagamentos.tsx` vira o componente
  `AbaPagamento`; `/pagamentos` passa a redirecionar para `/banco`.
- Novo `src/lib/extrato.ts` com `montaExtrato(data)`: saídas via
  `montaPagamentos` filtrando `forma !== "Crédito"`, entradas a partir de
  repasses/extras como já faz `src/lib/fluxo-caixa.ts`; devolve
  `{ id, iso, data, descricao, origem, forma, tipo: "entrada" | "saida", valor }`.
- Novo `src/lib/cartao.ts` com o agrupamento por fatura e o cálculo de
  limite usado/disponível (reaproveita `faturaPorMes`, `parcelasEmAberto`).
- Limite e dia de vencimento gravados no perfil do usuário (mesmo caminho já
  usado pelas configurações), com leitura por query e atualização otimista.
- Atalhos e menu: em `src/components/atalho-paginas.tsx` e
  `src/components/app-sidebar.tsx`, "Pagam." vira "Banco" apontando para
  `/banco`.
- `head()` própria para `/banco`.
- Testes do extrato e do cálculo de limite em `src/lib/__tests__`.
