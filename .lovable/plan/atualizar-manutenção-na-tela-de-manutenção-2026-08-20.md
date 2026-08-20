# Atualizar manutenção na tela de Manutenção

## Objetivo
Trocar o fluxo de "editar" manutenção por um botão de **Atualizar manutenção**, que registra uma nova troca realizada atualizando data, km, valor e observação no registro existente.

## O que será feito

1. **Tela `src/routes/manutencao.tsx`**
   - No card de cada item do plano de manutenção, substituir o ícone de editar (`AcoesLancamento`) por um botão primário **"Atualizar"`.
   - Manter o botão de excluir no mesmo local.
   - O clique em "Atualizar" abre um diálogo específico para aquele serviço/veículo.

2. **Novo diálogo de atualização**
   - Criar um componente interno `AtualizarManutencaoDialog` (ou reutilizar o formulário existente com campos filtrados) contendo:
     - **Data da troca**: pré-preenchida com a data de hoje, editável.
     - **Km da troca**: obrigatório; sugerido com o odômetro atual do painel.
     - **Valor gasto**: opcional.
     - **Observação**: opcional.
     - **Validade (km)**: pré-preenchida com a validade atual do registro, editável.
   - Veículo e serviço são mantidos inalterados (apenas leitura ou exibidos no cabeçalho).

3. **Persistência**
   - Usar a server function `salvarLancamentoFn` com o `row` do registro existente para atualizar a linha na tabela `MANUTENCAO`.
   - Após salvar, invalidar o cache do painel para recalcular o status de vencimento.

4. **Limpeza**
   - Remover o botão de editar geral da ação do card de manutenção (manter exclusão).
   - Garantir que o fluxo de despesa vinculada a manutenção continue funcionando como hoje.

## Não será alterado
- O cálculo de `statusManutencao` e os alertas na Home.
- A criação de nova manutenção pelo botão "Lançar manutenção".
- A tabela `MANUTENCAO` no banco de dados.

## Critérios de aceitação
- Cada card de manutenção exibe um botão "Atualizar" em vez do ícone de editar.
- O diálogo de atualização abre com data de hoje, km sugerido e validade atual.
- Ao salvar, o registro existente é atualizado e o status do item é recalculado.
- A exclusão continua disponível.
