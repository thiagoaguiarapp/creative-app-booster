# Tela Banco (Pagamento, Extrato e Cartão)

A tela "Pagamentos" passa a se chamar **Banco**, com três abas.

## Aba Pagamento
Exatamente o conteúdo atual da tela de pagamentos: cards de resumo, filtros
Mês atual / Mês passado / Total, participação por forma, histórico da fatura
do cartão, contas em aberto, lançamentos do período e os botões
"Nova despesa", "Lançar pagamento" e "Retirada pessoal".

## Aba Extrato (sua conta bancária)
O Extrato funciona como a conta: mostra tudo que entra e tudo que sai em
dinheiro, Pix ou débito. Compras no cartão **não** aparecem aqui — o que
aparece é o **pagamento da fatura**, descontado do saldo na data da baixa.

- **Entradas**: todos os recebimentos — repasses das plataformas, recebimentos
  em dinheiro/Pix na entrega e extras (gorjeta, sobra de troco).
- **Saídas**: despesas, abastecimentos, manutenções e retiradas pessoais pagos
  em dinheiro, Pix ou débito, na data em que o dinheiro saiu.
- **Saídas de fatura**: cada baixa de parcela do cartão vira uma linha
  "Pagamento de fatura do cartão" na data da baixa.

**Card fixo "Saldo em conta"** no topo da aba, sempre visível ao rolar,
mostrando o saldo atual (todas as entradas menos todas as saídas, de todo o
período) e, ao lado, entradas e saídas do período filtrado.

Lista única em ordem de data (mais recente primeiro). Cada linha mostra data,
descrição, origem (Repasse, Despesa, Fatura do cartão…), forma e o valor —
verde para entrada, vermelho para saída — com saldo acumulado.

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
