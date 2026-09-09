# Tela de Fechamento do mês

Uma tela só para fechar o mês, com regra de data única (data da compra) e sem risco de contar manutenção duas vezes.

## O que muda

### 1. Nova tela "Fechamento"
Nova página, com atalho junto das outras telas e filtro de mês (mês atual, mês passado, período personalizado).

Blocos da tela, de cima para baixo:

- **Resumo do mês**: faturado, recebido, custo total, lucro. Um número por linha, sem repetição entre telas.
- **Custos do mês em uma lista só**: combustível, despesas e manutenção juntos, agrupados por categoria, com opção de abrir e ver cada lançamento. É aqui que hoje você precisa abrir três telas.
- **Situação de pagamento**: dentro do mesmo mês, quanto já saiu do bolso e quanto ainda vai vencer (cartão), com o que está vencido em destaque. Botão "Paguei" direto na linha, igual ao que já existe em Banco.
- **Conferência**: avisos de lançamentos que parecem duplicados (mesma manutenção lançada como despesa e como manutenção), com botão para abrir e corrigir.
- **Botão "Fechar mês"**: marca visualmente que o mês foi conferido, com data da conferência.

### 2. Regra de data única
Todo custo entra no mês da **compra/lançamento**, inclusive crédito parcelado. O vencimento das parcelas continua existindo, mas só serve para dizer se aquele gasto já foi pago ou ainda vai vencer — nunca para mudar o mês em que ele conta.

Uma linha de apoio mostra "deste mês, R$ X ainda vencem no cartão em meses seguintes", para você não se perder.

### 3. Manutenção nunca duplica
Passa a existir um vínculo real entre a despesa e o registro de manutenção. Quando um serviço é lançado nos dois lugares, o valor conta **uma vez só** em todos os totais (Fechamento e Relatório). O registro de manutenção continua guardando km, validade e alertas normalmente.

Lançamentos antigos que hoje estão duplicados aparecem na "Conferência" para você resolver.

## Não muda
- Telas Despesas, Manutenção, Abastecimento, Repasses e Banco continuam funcionando como hoje.
- Estrutura das tabelas atuais e forma de lançar.
- Cálculo de vencimento por km e alertas de manutenção.

## Detalhes técnicos
- Novo `src/lib/fechamento.ts` com funções puras: consolidação de custos por competência, situação de pagamento por lançamento, e dedução de manutenção duplicada — cobertas por testes Vitest.
- Vínculo despesa↔manutenção gravado como marca na observação da manutenção (mesmo padrão de `[compra …]` / `[pago …]` já usado em `src/lib/pagamentos.ts`), evitando mudança de schema.
- Nova rota `src/routes/fechamento.tsx` reutilizando `painelQueryOptions`, `montaPagamentos` e os botões de baixa já existentes em `src/components/banco/`.
- `src/routes/relatorio.tsx` passa a usar o mesmo helper de dedução, eliminando a heurística atual duplicada.
- "Mês fechado" persistido por usuário na base (tabela simples: usuário, mês, data da conferência).

## Critérios de aceitação
- O total de custos do mês na tela Fechamento bate com combustível + despesas + manutenção sem duplicidade.
- Cada gasto conta no mês do lançamento, mesmo parcelado.
- Dá para ver e baixar, na mesma tela, o que ainda não foi pago.
- Relatório e Fechamento mostram o mesmo custo total para o mesmo período.
