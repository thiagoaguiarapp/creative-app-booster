# Meta de faturamento semanal na Home

## Objetivo
Adicionar uma meta de faturamento semanal na tela inicial, mostrando o progresso em relação ao faturamento da semana atual e permitindo editar o valor direto na home.

## O que será feito

1. **Banco de dados**
   - Criar tabela `METAS` no Supabase com `ID`, `USER_ID`, `TIPO`, `VALOR`, `ATUALIZADO_EM`.
   - Migration: `supabase/migrations/20260809000000_create_table_metas.sql`.

2. **Camada de servidor**
   - `src/lib/metas.server.ts`: ler e salvar a meta do usuário logado.
   - `src/lib/metas.functions.ts`: expor `getMetaSemanalFn` e `salvarMetaSemanalFn` via `createServerFn`.

3. **Tela inicial (`src/routes/index.tsx`)**
   - Carregar meta semanal no loader.
   - Calcular faturamento da semana atual (segunda a domingo) usando `date-fns`.
   - No card de "Faturamento", mostrar:
     - Valor faturado na semana.
     - Meta definida.
     - Progresso percentual + barra visual.
     - Botão para editar a meta (input inline no próprio card).
   - Se a meta ainda não foi definida, mostrar estado vazio com CTA "Definir meta".

4. **Validação**
   - Valor deve ser número positivo.
   - Feedback via `sonner` ao salvar.

## Estrutura de rotas resultante

Sem mudanças nas rotas. Apenas a home (`/`) ganha a nova seção de meta.

## Critérios de aceitação
- A home exibe a meta semanal e o progresso em relação ao faturamento da semana.
- O usuário pode definir/alterar a meta diretamente na tela inicial.
- O valor faturado considera apenas ganhos (`DIARIO`) dentro da semana atual (segunda a domingo).
- A meta é individual por usuário (filtrada por `USER_ID`).
