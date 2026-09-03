# Tela de controle de pagamentos

## Objetivo
Criar a tela **/pagamentos** para acompanhar quanto foi pago em cada forma — Dinheiro (à vista), Pix, Débito e Crédito — somando despesas e abastecimentos, com destaque para a fatura do crédito por mês e as parcelas que ainda vão vencer.

## O que a tela terá

1. **Cabeçalho e filtros**
   - Mesmo padrão das outras telas (atalhos + botão de novo lançamento).
   - Filtro de período: Mês atual / Mês passado / Total (igual ao de Despesas).

2. **Cards por forma de pagamento**
   - Um card para cada forma: Dinheiro, Pix, Débito, Crédito.
   - Cada card mostra o total pago no período e a quantidade de lançamentos.
   - Barra de participação mostrando o peso de cada forma no total do período.
   - Lançamentos sem forma informada entram como "Não informado".

3. **Fatura do crédito por mês**
   - Lista dos próximos meses com o total de parcelas que caem em cada um (inclui meses futuros, independentemente do filtro de período).
   - Destaque para o mês atual.

4. **Parcelas em aberto**
   - Lista das parcelas com data futura: data, descrição/categoria, valor e a marcação (2/6) quando existir.
   - Total geral a pagar exibido no topo da lista.

5. **Lançamentos do período**
   - Tabela/cards com data, origem (Despesa ou Abastecimento), descrição, forma e valor.
   - Layout compacto no celular, como nas demais telas.

## Regras de cálculo
- Entram despesas (aba DESPESA) e abastecimentos (forma de pagamento do abastecimento).
- As formas são normalizadas sem diferenciar maiúsculas/acentos: "dinheiro"/"a vista" → Dinheiro; "pix" → Pix; "debito" → Débito; "credito"/"cartao de credito" → Crédito; o resto vira "Outros".
- Parcelas já são gravadas como linhas separadas nos meses seguintes (ajuste feito agora com a data da 1ª parcela), então a fatura por mês é a soma das linhas de crédito com data naquele mês.
- Parcela em aberto = linha de crédito com data maior que hoje.

## Detalhes técnicos
- Nova rota `src/routes/pagamentos.tsx` com `head()` próprio, `errorComponent` e `notFoundComponent`, lendo `painelQueryOptions()` via loader + `useSuspenseQuery`.
- Novo helper `src/lib/pagamentos.ts` com a normalização das formas e as funções de agregação (totais por forma, fatura por mês, parcelas em aberto), reaproveitando `Despesa` e `Abastecimento` de `sheets-types`.
- Adicionar o item "Pagamentos" em `src/components/atalho-paginas.tsx` e no menu lateral `src/components/app-sidebar.tsx`.
- Nenhuma mudança no banco de dados nem nos formulários de lançamento.

## Critérios de aceitação
- `/pagamentos` abre com os quatro cards preenchidos e somando despesas + abastecimentos.
- A fatura do crédito mostra os totais mês a mês, incluindo meses futuros de compras parceladas.
- A lista de parcelas em aberto exibe apenas parcelas com data futura, com total correto.
- A tela funciona bem no celular e é acessível pelos atalhos e pelo menu.
