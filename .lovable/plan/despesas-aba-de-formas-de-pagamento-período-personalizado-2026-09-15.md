# Despesas: aba de Formas de pagamento + período personalizado

## O que muda na tela Despesas

A tela passa a ter duas abas:

1. **Lançamentos** — exatamente o que existe hoje (cards, gráfico por categoria e lista com detalhes).
2. **Formas de pagamento** — nova aba com o resumo das despesas do período separadas por Dinheiro, Pix, Débito, Crédito e Outros.

Os botões de período (Mês atual / Mês passado / Total) e a busca continuam no topo, valendo para as duas abas.

## Período personalizado

Um quarto botão **Personalizado** abre dois campos de data (De / Até). Ao escolher as datas, tudo na tela — cards, categorias, lista e a nova aba — passa a considerar apenas esse intervalo. Enquanto uma das datas estiver vazia, o filtro usa só a data preenchida (a partir de / até).

## Conteúdo da aba Formas de pagamento

- Um card por forma com: total gasto, quantidade de lançamentos e percentual sobre o total do período, com barra proporcional.
- No crédito, dois números extras: **já pago** e **a pagar** (parcelas com vencimento ainda em aberto).
- Abaixo, uma lista das despesas do período agrupada por forma de pagamento, cada linha mostrando data, categoria, descrição e valor; tocar na linha abre os mesmos detalhes usados hoje.
- Quando não houver despesas no período, aparece a mensagem de lista vazia.

## Detalhes técnicos

Arquivo alterado: `src/routes/despesas.tsx` (somente apresentação; nenhuma mudança em schema, gravação ou outras rotas).

- Estado `periodo` ganha o valor `"personalizado"` mais `de`/`ate` (strings ISO) em `useState`.
- O filtro atual por `prefixoMes` vira uma função única que, no modo personalizado, compara `d.iso >= de` e `d.iso <= ate`.
- Classificação por forma com `normalizaForma` de `src/lib/pagamentos.ts` (já retorna Dinheiro/Pix/Débito/Crédito/Outros); ordem fixa pela constante `FORMAS`.
- "Já pago" vs "a pagar" no crédito usa a marca `[pago dd/mm/aaaa]` via os helpers existentes de `pagamentos.ts`.
- Abas com `@/components/ui/tabs`; linhas reutilizam `LinhaDetalhavel` e `Detalhe`; datas nos inputs `type="date"`.
