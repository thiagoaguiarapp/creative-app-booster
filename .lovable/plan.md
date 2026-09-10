# Tela Manutenção: km no card + aba de histórico

## Objetivo
Melhorar a tela Manutenção em dois pontos: mostrar o km da última troca em cada card e criar uma aba "Histórico" com todas as manutenções já realizadas, em linhas com submenu de detalhes (mesmo padrão das telas Despesas/Ganhos/Abastecimento).

## O que será feito

1. **Km da troca no card** (`src/routes/manutencao.tsx`)
   - Adicionar no bloco de números do card o "Km da troca" (odômetro registrado na última vez que o serviço foi feito), junto de Rodado / Falta / Último custo.

2. **Abas na tela Manutenção**
   - Aba **Plano** (atual): cards com status de vencimento, sem alteração de comportamento.
   - Aba **Histórico** (nova): tabela com todas as manutenções já lançadas, ordenadas da mais recente para a mais antiga.

3. **Histórico em linhas com submenu**
   - Usar o componente compartilhado `LinhaDetalhavel`/`Detalhe` (mesmo padrão das outras telas).
   - Colunas da linha: Data, Serviço, Veículo, Valor.
   - Submenu (ao tocar na linha): veículo, data, km da troca, validade (km), valor, observação e as ações **Atualizar** / **Excluir** (reutilizando `AcoesManutencao` e o diálogo de atualização já existentes).

## Não será alterado
- Cálculo de status/vencimento e alertas na Home.
- Fluxo de lançar e atualizar manutenção.
- Banco de dados (sem migração).

## Detalhes técnicos
- Componentes de abas: `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` do shadcn (já usados na tela Banco).
- Fonte de dados: `data.manutencoes` do painel (já carregado na tela), apenas ordenado por data decrescente para a aba Histórico.

## Critérios de aceitação
- Cada card do plano mostra o km da última troca.
- A tela tem as abas "Plano" e "Histórico".
- A aba Histórico lista todas as manutenções; tocar na linha abre o submenu com detalhes e ações.
- Atualizar/excluir pelo histórico recalcula o plano normalmente.
