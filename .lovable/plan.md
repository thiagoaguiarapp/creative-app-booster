# Corrigir compras parceladas na tela "Todos os lançamentos"

Duas correções: deixar claro o valor de cada parcela na lista e preencher corretamente o formulário quando você abre uma parcela para editar.

## 1. Lista: valor e datas da parcela

Cada parcela continua sendo uma linha com o valor daquela parcela. O que muda é a informação em volta:

- A data mostrada na linha passa a ser a **data da compra** (é por ela que a despesa conta no mês).
- Abaixo da descrição aparece: `Parcela 2/3 de R$ 300,00 · vence 03/11/2026`.
- Nas compras à vista, nada muda.
- A marca interna `(2/3)` sai do texto da descrição, já que a informação passa a ter lugar próprio.

## 2. Edição: campos preenchidos com o que foi lançado

Hoje, ao editar uma parcela, o campo "Data" mostra o vencimento e os campos "Número de parcelas" e "Data do pagamento (vencimento)" vêm em branco. Passa a abrir assim:

- **Data**: data da compra.
- **Forma de pagamento**: já vem "Crédito parcelado" (ou "Crédito à vista").
- **Número de parcelas**: o total lido do lançamento (ex.: 3).
- **Data do pagamento (vencimento)**: o vencimento gravado daquela parcela.
- **Observação**: só o texto que você escreveu, sem as marcas internas.

Ao salvar, apenas a parcela editada é alterada — as outras parcelas da mesma compra ficam como estão. O app regrava internamente as marcas de compra e de numeração, para o histórico continuar consistente.

## Detalhes técnicos

- `src/lib/pagamentos.ts`: expor helpers `totalParcelas(descricao)` e `descricaoLimpa` sem a marca `(n/total)` (a leitura de `numeroParcela` e `isoCompra` já existe).
- `src/routes/lancamentos.tsx`: para despesas, usar `isoCompra`/data da compra na coluna Data e na ordenação; montar o detalhe com parcela, valor total estimado (valor × total) e vencimento (`d.iso`).
- `src/components/lancamento-form.tsx` (`valoresIniciais`): quando o registro for despesa de crédito, derivar `data` = data da compra da marca `[compra ...]`, `dataPrimeiraParcela` = data gravada da linha, `parcelas` = total lido de `(n/total)`, e limpar as marcas de `descricao`.
- `src/lib/painel-write.server.ts` (`salvarLancamento` com `row`): no caminho de edição de despesa no crédito, gravar `DATA` = `dataPrimeiraParcela` (vencimento) e `OBS` = descrição + `(n/total)` preservado + `[compra dd/mm/aaaa]` da data informada, mantendo eventual marca `[pago ...]`.
- Sem alteração de banco; lançamentos antigos sem marca continuam lidos pela data da linha.
