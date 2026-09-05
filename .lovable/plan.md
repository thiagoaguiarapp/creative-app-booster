# Botão "Lançar pagamento" e retirada pessoal (salário)

Na tela Pagamentos entra um segundo botão, ao lado de "+ Nova despesa": **"Dar baixa em pagamento"**. Ele serve para marcar como pagas as contas que ficaram em aberto (parcelas do cartão). O que foi pago à vista, em dinheiro, Pix ou débito já nasce quitado e nunca aparece como pendente.

Também entra a **retirada pessoal (salário)**: um lançamento próprio para o dinheiro que você tira para uso pessoal, contado como saída de caixa.

## Como vai funcionar

### Dar baixa
- O botão abre uma janela com a lista do que está em aberto: cada parcela de crédito ainda não paga, com data de vencimento, descrição e valor, das mais antigas para as mais novas.
- Vencidas aparecem destacadas.
- Você marca uma ou várias e confirma com a data em que pagou (hoje por padrão).
- A parcela sai da lista de pendências e passa a contar como paga.
- Dá para desfazer a baixa: itens já pagos do mês ficam numa lista "Pagos" com a opção "desfazer".
- Dinheiro, Pix, débito e crédito à vista já com vencimento passado não entram na lista de pendências — foram pagos no ato.

### Retirada pessoal (salário)
- Novo botão/opção "Retirada pessoal" no menu de novo lançamento e na tela Pagamentos.
- Campos: data, valor, forma (dinheiro, Pix, débito) e observação.
- Vira uma saída de caixa normal, com a categoria "Retirada pessoal": entra no total pago do mês, no fluxo de caixa e reduz o saldo.
- Na tela Pagamentos ganha um card separado "Retiradas do período", para você ver quanto tirou sem confundir com custo do trabalho.

## Mudanças na tela Pagamentos
- Cabeçalho com os dois botões: "+ Nova despesa" e "Dar baixa em pagamento".
- Novos cards: "A pagar (vencido)" e "Retiradas do período".
- A seção "Parcelas em aberto" passa a mostrar só o que ainda não recebeu baixa, com botão de baixa rápida em cada linha.

## Detalhes técnicos
- Sem mudança de banco. A baixa é gravada como marca na observação da despesa, no mesmo padrão já usado por `[compra dd/mm/aaaa]`: `[pago dd/mm/aaaa]`.
- `src/lib/pagamentos.ts`: novos helpers `marcaPago`, `isoPago(descricao)`, `estaPago(pagamento, hojeIso)` (à vista/Pix/débito = sempre pago; crédito = pago só com a marca), `limpaDescricao` passa a remover também `[pago ...]`; `parcelasEmAberto` filtra por `!estaPago` em vez de data futura, incluindo vencidas.
- `src/lib/painel-write.server.ts` + `src/lib/painel.functions.ts`: nova função de servidor `baixarPagamentoFn` (recebe `{ row, dataPago }` ou `{ row, desfazer: true }`) que lê a linha da despesa, acrescenta/remove a marca na coluna de observação e regrava; usa os helpers já existentes de `atualizar`. Invalida a query do painel após a gravação.
- Abastecimentos ficam sempre quitados (sem parcelamento hoje), então a baixa só se aplica a despesas.
- `src/components/lancamento-form.tsx` e `src/lib/entry-schema.ts`: novo tipo lógico "retirada" reaproveitando a gravação de despesa, com categoria fixa "Retirada pessoal" e campos data/valor/forma/observação; formas restritas a Dinheiro, Débito e Pix.
- `src/routes/pagamentos.tsx`: diálogo de baixa (shadcn `Dialog` + checkboxes + input de data), novos cards, botão de baixa por linha, card de retiradas (soma das despesas com categoria "Retirada pessoal" no período).
- `src/lib/fluxo-caixa.ts`: retiradas já entram como saída porque são despesas; nenhuma mudança de cálculo, apenas garantir que não sejam filtradas.
- Rodar `bunx tsgo --noEmit` ao final.
