# Corrigir "A receber de meses anteriores" (iFood e Uber)

## Diagnóstico confirmado nos seus dados

Conferi o histórico real. Até julho, a diferença acumulada é: iFood R$ 439,46, Uber R$ 28,54, 99 R$ 18,00, Zuply R$ 10,31.

Em agosto o iFood pagou R$ 1.329,41 contra R$ 954,42 faturados e a Uber pagou R$ 132,43 contra R$ 128,19. Como hoje o app baixa **primeiro o faturamento do próprio mês do repasse** e só depois usa a sobra para trás, sobram R$ 64,47 (iFood) e R$ 24,30 (Uber) rotulados como "meses anteriores" — quando, na prática, essa diferença é do mês corrente. A Zuply não recebeu nada em agosto, por isso os R$ 10,31 dela são realmente antigos e aparecem certos.

## O que será feito

1. Mudar a regra de baixa para **mais antigo primeiro**: todo repasse quita a dívida mais velha da plataforma antes de tudo, sem priorizar o mês do próprio repasse.
2. Com isso, no período atual:
   - iFood e Uber saem do card "A receber de meses anteriores" (ficam zerados lá).
   - A diferença que ainda falta passa a aparecer como pendência do mês atual, na conciliação por aplicativo.
   - Zuply continua com os R$ 10,31 de meses anteriores.
3. Manter os demais cards (Saldo nas plataformas, Ganho extra, recebido em dinheiro/Pix) e a auditoria mensal como estão — o saldo total por plataforma não muda, só a atribuição entre mês atual e meses anteriores.
4. Conferir os totais depois da mudança contra os dados reais das tabelas DIARIO e REPASSE.

## Detalhes técnicos

- Em `src/lib/conciliacao.ts`, na função `quitacaoPorApp`, substituir a ordem de grupos (mês do repasse → meses anteriores → meses posteriores) por uma varredura cronológica única das dívidas ordenadas por data, do mais antigo para o mais novo.
- Nenhuma mudança de dados ou de schema; `src/routes/repasses.tsx` continua consumindo a mesma função, sem alteração de layout.
