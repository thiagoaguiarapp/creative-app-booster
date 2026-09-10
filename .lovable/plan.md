# Remover forma de pagamento da atualização de manutenção vinda de despesa

## Problema
Ao lançar uma **despesa** com categoria de manutenção (ex.: "Manutenção", "Troca de óleo"), o app abre a seguir a tela de manutenção para completar km e validade. Essa tela mostra os campos de **forma de pagamento, parcelas e data da primeira parcela** — informação que já foi preenchida na despesa, causando repetição e risco de divergência.

## O que será feito

1. **Tela de manutenção encadeada (após despesa)**
   - No fluxo em `src/components/lancamento-form.tsx` que abre a manutenção logo após salvar a despesa ("Atualizar manutenção existente" / "Registrar manutenção do serviço"), passar um parâmetro novo `semPagamento` para o formulário.
   - Com `semPagamento` ativo, ocultar os campos `pagamento`, `parcelas` e `dataPrimeiraParcela` — a manutenção salva sem forma de pagamento (o valor/custo fica registrado apenas na despesa, sem gerar parcelas duplicadas).
   - Manter o campo **Valor** visível com valor sugerido em branco (a despesa já guarda o valor; a manutenção pode ficar com custo zero), com o aviso atual "O valor já foi lançado na despesa — aqui atualize apenas km e validade."

2. **Gravação**
   - Nenhuma mudança na gravação: a manutenção continua sendo salva/atualizada pela mesma função de sempre, apenas sem os campos de pagamento.

## Não será alterado
- O botão "Atualizar" da própria tela Manutenção (diálogo `AtualizarManutencaoDialog`) — que já não pede forma de pagamento.
- O lançamento de manutenção direta pelo botão "Lançar manutenção" (onde a forma de pagamento continua aparecendo, pois ali não há despesa vinculada).
- A regra de parcelas de crédito das despesas.

## Critérios de aceitação
- Ao lançar despesa de manutenção e continuar para a tela de manutenção, não aparece forma de pagamento, parcelas ou data de vencimento.
- A manutenção é salva/atualizada normalmente com data, km e validade.
- O lançamento direto de manutenção (sem despesa) continua oferecendo forma de pagamento.
