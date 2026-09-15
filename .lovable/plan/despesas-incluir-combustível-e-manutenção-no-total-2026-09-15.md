# Despesas: incluir combustível e manutenção no total

Hoje a tela Despesas soma só os lançamentos de "despesa". Combustível (abastecimento) e manutenção também são gastos, mas ficam de fora. A ideia é juntar tudo em um único total, sem contar nada duas vezes e mantendo visível de onde vem cada gasto.

## O que muda na tela Despesas

1. **Total do período passa a somar tudo:** despesas + combustível + manutenção.
2. **Novo resumo por origem** no topo: três cartões — Combustível, Manutenção e Outras despesas — com valor e quantidade de lançamentos de cada um.
3. **Lista de lançamentos unificada**, com uma etiqueta de origem em cada linha (Combustível / Manutenção / Despesa). Ao tocar na linha, os detalhes continuam aparecendo como hoje (posto, litros e odômetro no combustível; serviço, km e validade na manutenção).
4. **Filtro de origem**: botões para ver Tudo, só Combustível, só Manutenção ou só Outras despesas, junto dos filtros de período já existentes.
5. **Busca e período personalizado** continuam funcionando, agora sobre a lista unificada.
6. **Aba "Formas de pagamento"** passa a considerar também combustível e manutenção, já que ambos têm forma de pagamento.
7. **Por categoria**: combustível entra como "Combustível" e manutenção pelo nome do serviço, para o gráfico de barras refletir o gasto real.

## Cuidado com duplicidade

Duas situações que hoje poderiam contar o mesmo gasto duas vezes:

- Despesa de categoria de manutenção que gerou um registro de manutenção: só uma das duas entra no total (a mesma regra já usada no relatório, em `src/lib/fechamento.ts`).
- Manutenção sem valor lançado (só km/validade) não soma nada.

Abastecimento é sempre registro próprio, sem risco de duplicar com despesa.

## Detalhes técnicos

- Nova função em `src/lib/despesas-unificadas.ts`: recebe `PainelData` e devolve uma lista única `{ id, origem, iso, data, valor, categoria, descricao, pagamento, bruto }`, já aplicando `paresDuplicados` para descartar a manutenção duplicada.
- `src/routes/despesas.tsx` passa a consumir essa lista no lugar de `data.despesas`; `LinhaDespesa` ganha coluna de origem e detalhes específicos por tipo.
- Ações de editar/excluir de cada linha continuam usando o `tipo` correto (`despesa`, `abastecimento`, `manutencao`) em `AcoesLancamento`.
- `src/routes/relatorio.tsx` não muda; ele já trata a duplicidade.

## Critérios de aceitação

- O total do período na tela Despesas bate com "Custo total" do relatório no mesmo período.
- Cada lançamento aparece uma única vez, com sua origem identificada.
- Dá para filtrar por origem e a soma dos três cartões é igual ao total.
