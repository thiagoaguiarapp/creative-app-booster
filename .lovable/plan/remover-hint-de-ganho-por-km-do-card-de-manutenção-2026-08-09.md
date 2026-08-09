# Remover hint de "Ganho por km" do card de Manutenção

## Alteração

Na tela **Relatório por período** (`src/routes/relatorio.tsx`), remover o `hint` do `StatCard` de Manutenção, deixando apenas o valor principal como a soma dos gastos com manutenção no período.

## Detalhe técnico

- Arquivo: `src/routes/relatorio.tsx`
- Linha-alvo: `<StatCard label="Manutenção" ... />`
- Remover a prop `hint={`Ganho por km ${r.km ? brl(r.lucro / r.km) : brl(0)}`}`.
- O valor principal continua sendo `r.manutencao` (soma da tabela `MANUTENCAO`).

## Resultado esperado

O card de Manutenção exibe apenas o valor gasto, sem informação secundária de ganho por km.
