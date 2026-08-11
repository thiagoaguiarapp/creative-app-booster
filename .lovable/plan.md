# Remover card "Faturamento da semana" da tela inicial

## Objetivo
Na tela Início, remover o card de resumo **"Faturamento da semana"** (que ficava ao lado do card da Meta semanal). O card **Meta semanal** permanece na tela.

## O que será feito

1. **`src/routes/index.tsx`** — remover o bloco do `StatCard` com `label="Faturamento da semana"` (linhas 217-223), mantendo apenas o `CardMetaSemanal`.

2. **Limpeza de import** — remover o import de `CircleDollarSign`, que passa a ficar sem uso na página.

3. **Ajuste de layout** — como o grid de dois cards (`sm:grid-cols-2`) passa a ter apenas um item, o `CardMetaSemanal` fica exibido sozinho (largura cheia), sem alteração estrutural necessária.

## Não será alterado
- O cálculo do `faturamentoSemana` continua existindo (é usado internamente pela `CardMetaSemanal` para o progresso da meta).
- Demais cards e seções da tela (resumo, últimos lançamentos, manutenção, anúncio).

## Critério de aceitação
- Abrir `/` mostra a tela inicial sem o card "Faturamento da semana".
- O card "Meta semanal" continua aparecendo com sua barra de progresso normalmente.
- Nenhum erro de compilação (import não utilizado removido).
