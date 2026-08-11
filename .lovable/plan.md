# Ajustar a aba Ganhos diários

Dois problemas hoje:

1. **O gráfico "Evolução" some com os dias.** Ele é montado a partir dos lançamentos já filtrados pelo botão de período. Com "Hoje" selecionado, só sobram os registros de hoje — por isso o faturamento do dia 10 aparece zerado nas barras.
2. **A tela mistura leituras.** O nome é "Ganhos diários", mas o gráfico é sempre semanal (últimos 7 dias), independente do período escolhido.

## O que muda

**Gráfico sempre lê a base completa**
As barras passam a ser calculadas sobre todos os ganhos, não sobre a lista filtrada. Assim, dias anteriores continuam com valor mesmo quando o filtro está em "Hoje".

**Gráfico acompanha o período escolhido**

| Botão | O que o gráfico mostra |
|---|---|
| Hoje | Faturamento do dia separado por plataforma (iFood, 99, etc.) |
| Ontem | Faturamento do dia anterior por plataforma |
| Esta semana | Um barra por dia, de domingo até hoje |
| Personalizado | Uma barra por dia dentro do intervalo escolhido (limitado aos últimos 31 dias do intervalo para não ficar ilegível) |

O título do card muda junto: "Ganhos de hoje por app", "Ganhos da semana por dia", etc., para ficar claro o que está sendo lido.

**Foco diário na tela**
- Os cards de resumo ganham rótulo com o período ativo (ex.: "Faturamento — Hoje") em vez de números soltos.
- Quando o período é "Hoje" ou "Ontem" e não há lançamento, o gráfico mostra um estado vazio com a mensagem "Nenhum ganho lançado neste dia" em vez de barras zeradas.
- A tabela de lançamentos mantém o comportamento atual (registros do período filtrado).

## Detalhes técnicos

- Arquivo: `src/routes/ganhos-diarios.tsx`.
- Trocar o `useMemo` de `ultimos7Dias` por um `useMemo` `serieGrafico` que retorna `{ label, valor }[]` e depende de `data.ganhos` (não filtrados), `periodo`, `de`, `ate`.
- Para "Hoje"/"Ontem": agrupar por `g.plataforma` somando `faturamento`.
- Para "Esta semana": iterar do domingo (`offsetDia(isoHoje(), -new Date().getDay())`) até hoje.
- Para "Personalizado": iterar as datas entre `de` e `ate` (fallback para os últimos 7 dias quando vazio).
- Sem mudanças em consultas, tipos ou lógica de gravação.
