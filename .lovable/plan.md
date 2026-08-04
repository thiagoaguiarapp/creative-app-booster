# Plano: Filtro de período na tela de Despesas

## Objetivo
Adicionar os botões de filtro **Mês atual / Mês passado / Total** na tela `Despesas`, igual já existe nas telas `Abastecimento` e `Repasses`. Todos os números, gráficos e a lista de lançamentos devem respeitar o período selecionado.

## O que será alterado

### `src/routes/despesas.tsx`
1. **Estado de período**
   - Adicionar `useState<"atual" | "passado" | "total">` com padrão `"atual"`.
   - Criar constante `PERIODOS` com os três botões.
   - Reutilizar a função `prefixoMes(offset)` já usada em `abastecimento.tsx` e `repasses.tsx`.

2. **Filtrar despesas**
   - Criar `lista` filtrada por `d.iso.startsWith(prefixo)` quando o período não for "total".
   - Substituir todas as referências de `data.despesas` por `lista` nos cálculos e na tabela.

3. **Atualizar métricas**
   - `total`: soma dos valores filtrados.
   - `despesas.length`: quantidade filtrada.
   - `categorias`: agrupamento e barras proporcionais usando o total filtrado.
   - `recentes`: primeiros 15 itens da lista filtrada.

4. **UI**
   - Inserir a barra de botões de período logo abaixo do `PageHeader`, mantendo o mesmo estilo das outras telas.
   - Manter o botão `NovoLançamento` no cabeçalho e as ações de editar/excluir em cada linha.

## Fora de escopo
- Nenhuma mudança no schema de despesas, no Google Sheets, no cache ou nas outras rotas.

## Validação
- Verificar no preview se os três botões aparecem.
- Trocar entre "Mês atual", "Mês passado" e "Total" e confirmar que os cards, o gráfico de categorias e a tabela atualizam.
