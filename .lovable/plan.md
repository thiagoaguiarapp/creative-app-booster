# Card de saldo por plataforma (Recebimento / Repasse)

## Problema

A tabela "Conciliação por aplicativo" só mostra o que falta receber no período. Quando a plataforma paga a mais (repasse maior que o faturado), esse crédito some da tela — não dá para ver como está a conta com cada app.

## O que será feito

1. **Novo card "Saldo nas plataformas"**, acima da conciliação, com o saldo acumulado (todo o histórico, sem filtro de período) de cada aplicativo:
   - Saldo = tudo que foi faturado no app − tudo que já foi recebido dele.
   - Valor positivo: a plataforma ainda deve (a receber), em cor de alerta.
   - Valor negativo: recebido a mais / crédito com o entregador, em cor positiva e rotulado como "recebido a mais".
   - Saldo zerado: "Em dia".
2. **Resumo no topo do card**: total a receber, total recebido a mais e o saldo líquido geral.
3. **Cada linha mostra** aplicativo, faturado histórico, recebido histórico, saldo e um selo de situação (A receber / Em dia / Recebido a mais).
4. Gorjeta e sobra de troco continuam fora do cálculo (só entram nos cards de ganho extra).
5. A conciliação por aplicativo e os demais cards ficam como estão.

## Detalhes técnicos

- Adicionar em `src/lib/conciliacao.ts` uma função pura `saldoPorPlataforma(ganhos, repasses)` que agrupa por nome normalizado e devolve `{ app, faturado, recebido, saldo }` ordenado pelo maior saldo em módulo.
- Em `src/routes/repasses.tsx`, consumir essa função com `data.ganhos` e `data.repasses` completos (independente do filtro de período) e renderizar a nova `SectionCard` com `Table`, reutilizando `brl` e os tokens de cor existentes (`text-warning`, `text-success`, `text-muted-foreground`).
