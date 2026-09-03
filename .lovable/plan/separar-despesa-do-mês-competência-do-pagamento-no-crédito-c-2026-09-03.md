# Separar despesa do mês (competência) do pagamento no crédito (caixa)

Hoje, quando a despesa é lançada no crédito, o app grava a linha já com a data da parcela. Resultado: a despesa some do mês em que foi feita e aparece só no mês do pagamento. Você quer o contrário: a despesa conta no mês do lançamento, e o pagamento do crédito aparece como saída do mês em que vai ser pago.

## Como vai funcionar

- Toda despesa é gravada com a **data da compra**. Nada de banco novo.
- O vencimento do crédito é **calculado pelo app**: parcela 1 no mês seguinte à compra, parcela 2 no mês seguinte a essa, e assim por diante (dia igual ao da compra, ajustado quando o mês é mais curto).
- Compra parcelada continua gerando uma linha por parcela, com o valor dividido e a marca `(1/3)`, `(2/3)`… na observação — mas todas com a data da compra, para o mês da despesa ficar completo.
- Dinheiro, Pix e débito continuam iguais: despesa e pagamento no mesmo dia.

## Tela Despesas

- O total do período passa a ser o total **por competência** (tudo que foi lançado no mês, à vista ou crédito) — comportamento atual, agora correto para o crédito.
- Novo destaque abaixo dos cards: "Pago no mês: R$ X · A pagar em meses seguintes: R$ Y", com a soma do crédito que só vence depois.
- Na lista, cada despesa no crédito ganha uma marca discreta com o mês de vencimento (ex.: "vence out/2026").

## Tela Pagamentos

- Os cards de Dinheiro, Pix, Débito e Crédito passam a usar a **data de pagamento** (crédito = vencimento calculado), não a data da compra. Assim o card mostra o que realmente sai do bolso naquele mês.
- Novo card de resumo no topo: "Saiu no mês" (à vista + faturas vencidas no mês) e "Vai sair depois".
- "Fatura do crédito por mês" e "Parcelas em aberto" passam a usar o mesmo vencimento calculado, ficando coerentes com a data da compra registrada.
- A lista de lançamentos mostra as duas datas: compra e vencimento.

## Formulário

- O campo "Data da 1ª parcela" sai do formulário de despesa: o vencimento vira automático a partir da data da compra. "Número de parcelas" continua aparecendo só no crédito.

## Detalhes técnicos

- `src/lib/painel-write.server.ts`: parar de substituir `data` por `dataPrimeiraParcela` e parar de deslocar meses nas parcelas; gravar sempre a data da compra e manter a numeração `(n/total)` na observação.
- `src/lib/entry-schema.ts`: remover o campo `dataPrimeiraParcela` de `CAMPOS.despesa`.
- `src/lib/pagamentos.ts`: acrescentar ao tipo `Pagamento` um `isoPagamento`/`dataPagamento` derivado (crédito = compra + 1 mês, com deslocamento extra pela parcela lida de `(n/total)`); `totaisPorForma`, `faturaPorMes` e `parcelasEmAberto` passam a usar esse campo.
- `src/routes/pagamentos.tsx` e `src/routes/despesas.tsx`: novos resumos e rótulos descritos acima; nenhuma mudança de banco.
- Lançamentos antigos de crédito continuam sendo exibidos; para eles a data gravada é lida como data da compra.
