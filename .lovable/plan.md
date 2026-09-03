# Crédito com data de vencimento: despesa no mês da compra, pagamento no mês da parcela

Volta o campo "Data da 1ª parcela" e a gravação de cada parcela na data do vencimento. Para que a tela Despesas continue contando no mês da compra, cada parcela guarda também a data da compra na observação.

## Como vai funcionar

- No crédito você informa "Data da 1ª parcela" e o "Número de parcelas".
- Cada parcela vira uma linha: a 1ª na data informada, as seguintes um mês depois de cada (dia ajustado em meses curtos).
- A observação de cada parcela fica assim: `Óleo (2/3) [compra 03/09/2026]` — a marca de compra é discreta e some da descrição exibida.
- Dinheiro, Pix e débito continuam iguais: uma linha, mesma data.

## Tela Despesas

- Total e lista voltam a usar o **mês da compra** (lido da marca; sem marca, usa a data da linha).
- Continua o destaque "Pago no mês" e "A pagar em meses seguintes", agora com o vencimento real gravado.
- Cada parcela no crédito mostra "vence dd/mm/aaaa".

## Tela Pagamentos

- O mês soma pela **data da linha**: à vista/Pix/débito = data do lançamento; crédito = data do vencimento da parcela. Sem cálculo estimado.
- Card de crédito mostra o valor da fatura daquele mês.
- "Fatura do crédito por mês" vira o histórico do cartão: meses passados e futuros, com total por mês.
- "Parcelas em aberto" lista as que ainda vão vencer.
- Lista de lançamentos mostra compra e vencimento nas parcelas de crédito.

## Manutenção

- O formulário de manutenção ganha "Forma de pagamento", "Número de parcelas" e "Data da 1ª parcela" (os dois últimos só no crédito).
- Como a tabela de manutenção não tem coluna de pagamento nem parcelas, o parcelamento é registrado na despesa vinculada que a manutenção já gera — assim o valor entra em Pagamentos como fatura do cartão.

## Detalhes técnicos

- `src/lib/entry-schema.ts`: recolocar `dataPrimeiraParcela` em `CAMPOS.despesa` (visível só no crédito) e acrescentar `pagamento`/`parcelas`/`dataPrimeiraParcela` em `CAMPOS.manutencao`.
- `src/lib/painel-write.server.ts`: no crédito, gravar `DATA` = vencimento da parcela (1ª = `dataPrimeiraParcela`, demais `somaMeses`), anexando `[compra dd/mm/aaaa]` à observação; manutenção parcelada repassa esses campos para a despesa vinculada.
- `src/lib/pagamentos.ts`: `isoPagamento` passa a ser a própria data da linha; extrair `isoCompra` da marca `[compra ...]` (fallback: a própria data). `faturaPorMes` e `parcelasEmAberto` seguem por `isoPagamento`; `faturaPorMes` deixa de filtrar meses futuros para virar histórico.
- `src/routes/despesas.tsx`: agrupar por `isoCompra`; exibir o vencimento gravado no lugar do calculado.
- `src/routes/pagamentos.tsx`: manter cards e filtros por data de pagamento; histórico de fatura com meses anteriores e o mês atual destacado.
- Helper compartilhado para limpar a marca `[compra ...]` na exibição das descrições.
- Sem mudança de banco; lançamentos antigos continuam sendo lidos pela data da linha.
