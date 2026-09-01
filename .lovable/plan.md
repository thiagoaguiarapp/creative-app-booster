# Corrigir custo duplicado da despesa de manutenção

## O problema (confirmado no código)
Ao lançar uma **despesa** de categoria de manutenção, o app abre em seguida o formulário de manutenção já preenchido com o **mesmo valor** da despesa. Resultado: o valor fica gravado nas duas tabelas (DESPESA e MANUTENCAO).

No relatório (`src/routes/relatorio.tsx`), os custos são somados como `combustível + despesas + manutenção` — então esse mesmo gasto entra duas vezes no total de custos e no lucro. Em "Todos os lançamentos" ele também aparece duplicado.

## Correção proposta
Manter o gasto **apenas na despesa** e usar o registro de manutenção somente para o controle de km/validade:

1. **`src/components/lancamento-form.tsx`**
   - Ao encadear a despesa para o formulário de manutenção, não pré-preencher o campo **Valor gasto** com o valor da despesa (enviar vazio/zero).
   - Ajustar o texto de apoio para deixar claro que o valor já foi lançado na despesa e ali só se registra km e validade.

2. **`src/routes/relatorio.tsx`**
   - Como salvaguarda para registros antigos já duplicados, desconsiderar do total de "Outras despesas" as despesas de categoria de manutenção que tenham manutenção correspondente na mesma data/serviço (usando os helpers de `src/lib/manutencao-link.ts`), evitando contar o mesmo gasto duas vezes.
   - Os cards continuam mostrando "Manutenção" separado, mas o total de custos e o lucro passam a ficar corretos.

## Não muda
- O fluxo de lançar despesa e o de lançar manutenção avulsa (com valor) continuam iguais.
- Cálculo de vencimento por km e os alertas da tela inicial.
- Estrutura das tabelas no banco.

## Critérios de aceitação
- Lançar despesa de manutenção e completar o registro de manutenção não soma o valor duas vezes no relatório.
- O formulário de manutenção encadeado abre sem valor pré-preenchido.
- Registros antigos duplicados deixam de inflar o total de custos.
