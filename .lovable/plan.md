# Remover cards de resumo em Todos os lançamentos

Os três cards (Registros, Entradas, Saídas) somavam Faturamento e Repasses juntos, contando o mesmo dinheiro duas vezes. Como o valor não ajuda no entendimento, os cards serão removidos.

## O que muda

- A faixa de cards no topo da tela Todos os lançamentos sai.
- A contagem de registros continua visível no subtítulo da lista ("X registros encontrados").
- Filtros, busca por período, tabela e ações de editar/excluir permanecem iguais.

## Detalhes técnicos

Em `src/routes/lancamentos.tsx`:
- Remover o bloco `<div className="grid gap-4 sm:grid-cols-3">` com os três `StatCard`.
- Remover os cálculos `entradas` e `saidas`.
- Limpar imports não usados (`StatCard`, `ListChecks`, `TrendingUp`, `TrendingDown`, e `brl` se deixar de ser usado — ele continua em uso na tabela).
