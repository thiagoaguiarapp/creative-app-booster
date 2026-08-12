# Corrigir a conciliação mensal de recebimentos

## Objetivo

Fazer cada aplicativo fechar por competência mensal: somar todo o faturamento do mês, registrar o saldo que ficou faltando e permitir que um recebimento lançado no mês seguinte quite automaticamente essa pendência anterior.

## Implementação

1. **Criar um único cálculo cronológico por aplicativo**
   - Agrupar faturamentos por aplicativo e mês.
   - Ordenar os meses do mais antigo para o mais recente.
   - Aplicar cada recebimento ao saldo pendente mais antigo do mesmo aplicativo, independentemente do mês em que o dinheiro entrou.
   - Manter qualquer sobra disponível para quitar o próximo saldo, sem misturar aplicativos.

2. **Registrar o resultado de cada mês**
   - Para cada mês, calcular: faturado, recebido aplicado, saldo pendente e status.
   - Marcar o mês anterior como **Quitado** quando um recebimento posterior completar seu valor.
   - Marcar como **Parcial** quando apenas parte do faturamento tiver sido recebida e como **Pendente** quando não houver baixa suficiente.
   - Continuar excluindo gorjetas e sobra de troco dessa conciliação.

3. **Unificar os números exibidos na tela**
   - Fazer os cards “A receber (mês)” e “A receber (meses anteriores)” usarem o mesmo resultado cronológico da tabela.
   - Na conciliação por aplicativo, separar o total recebido no período do valor efetivamente aplicado ao faturamento daquele mês.
   - Exibir a baixa feita no mês seguinte no detalhamento do mês quitado, incluindo data e valor do repasse.
   - Ocultar da lista de pendências antigas os meses que já foram totalmente quitados.

4. **Validar os cenários principais**
   - Faturamento e recebimento completos no mesmo mês.
   - Recebimento parcial no mês e complemento no mês seguinte.
   - Um único repasse no mês seguinte quitando o saldo anterior e parte ou todo o mês atual.
   - Repasses insuficientes, excedentes e vários aplicativos no mesmo período.

## Resultado esperado

Se um aplicativo faturar R$ 1.000 em junho, receber R$ 700 em junho e R$ 300 em julho, junho ficará com saldo de R$ 300 até o lançamento de julho e depois aparecerá como **Quitado**, sem continuar no card de meses anteriores. O restante dos recebimentos de julho seguirá sendo aplicado cronologicamente ao faturamento ainda aberto do mesmo aplicativo.

## Detalhes técnicos

- Concentrar a regra em funções puras de conciliação, evitando os cálculos paralelos que hoje existem entre `conciliacao.ts` e a rota de repasses.
- Retornar a alocação de cada repasse aos meses quitados para que cards, tabela e detalhamento consumam exatamente a mesma fonte.
- Adicionar testes de regressão para a passagem de saldo entre meses.
