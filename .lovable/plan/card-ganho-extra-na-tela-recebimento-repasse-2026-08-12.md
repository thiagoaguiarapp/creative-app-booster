# Card "Ganho extra" na tela Recebimento/Repasse

## Objetivo

Juntar gorjeta e sobra de troco em um único card chamado **Ganho extra**, mostrando o total em destaque e a divisão logo abaixo.

## O que muda

- Na tela **Recebimento / Repasse**, os cards separados "Gorjetas" e "Sobra de troco" dão lugar a um único card **Ganho extra**.
- Valor principal: soma de gorjeta + sobra de troco do período selecionado.
- Abaixo do valor, em letra menor: `Gorjeta R$ X · Sobra de troco R$ Y`.
- Continua contando apenas o que foi lançado em **Ganhos diários** (regra atual), e o aviso de extras lançados por engano como repasse permanece.

## Detalhes técnicos

- `src/routes/repasses.tsx`: substituir os dois `StatCard` (linhas ~347-360) por um único com `label="Ganho extra"`, `value={brl(gorjetas + sobraTroco)}`, ícone `HandCoins`, tom `success` e `hint` com a quebra dos dois valores.
- Sem mudanças em cálculo, conciliação ou banco de dados.
