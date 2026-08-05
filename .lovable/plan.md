# Renomear botões "Novo" de lançamento

## Objetivo
Tornar os botões de novo lançamento mais descritivos, mostrando o nome do tipo de registro que será criado.

## O que será feito

1. **Alterar `src/components/lancamento-form.tsx`**
   - No componente `NovoLancamento`, substituir o rótulo genérico "Novo" pelo nome do tipo de lançamento.
   - Utilizar o mapa `TITULOS` de `src/lib/entry-schema.ts` para manter os textos consistentes com os títulos dos formulários.

## Resultado esperado
- Botões como "Novo ganho", "Novo abastecimento", "Nova despesa", "Novo repasse" e "Nova manutenção".
- O ícone `Plus` continua aparecendo antes do texto.

## Critérios de aceitação
- O botão de novo lançamento em todas as telas exibe o nome correspondente ao tipo de registro.
- Não há regressão na abertura do formulário ou no salvamento.
