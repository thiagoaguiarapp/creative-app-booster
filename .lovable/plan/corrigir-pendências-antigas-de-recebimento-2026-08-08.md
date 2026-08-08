# Corrigir pendências antigas de recebimento

## Diagnóstico confirmado

- A tela calcula o saldo histórico usando **faturamentos da aba DIA A DIA menos recebimentos da aba REPASSE**, agrupados por aplicativo.
- Nos dados atuais, esse cruzamento ainda encontra **R$ 2.275,12 sem baixa correspondente**: 99 (R$ 1.545,39), iFood (R$ 382,22), Uber (R$ 158,37) e Zuply (R$ 189,14).
- Há também pelo menos uma data suspeita na aba REPASSE: um recebimento de 99 foi lançado como **01/03/2025** entre registros de março de 2026. A conferência precisa tornar erros assim visíveis.

## Implementação

1. **Criar uma auditoria mensal por aplicativo**
   - Quebrar o histórico em mês + plataforma, mostrando faturado, recebido e diferença.
   - Exibir somente meses com divergência por padrão, com opção de visualizar os meses conciliados.
   - Permitir expandir cada mês para consultar os ganhos e repasses individuais que formam o total.

2. **Sinalizar lançamentos suspeitos**
   - Destacar recebimentos sem faturamento compatível no período, meses sem nenhuma baixa e datas fora da sequência esperada.
   - Mostrar nome, data, valor e linha da planilha para localizar rapidamente o registro incorreto.
   - Reaproveitar as ações existentes para editar ou excluir diretamente o lançamento suspeito.

3. **Corrigir a apresentação do saldo histórico**
   - Calcular a pendência como saldo acumulado cronológico por aplicativo, carregando créditos excedentes de um mês para quitar débitos anteriores ou seguintes.
   - Não mostrar como “pendência antiga” um mês já compensado por recebimento posterior.
   - Manter gorjetas e sobra de troco fora da conciliação de plataformas.

4. **Validar com os dados reais**
   - Comparar os totais do app com as abas DIA A DIA e REPASSE.
   - Conferir especialmente 99, iFood, Uber e Zuply e validar que cada valor aberto possa ser explicado por lançamentos visíveis na auditoria.

## Resultado esperado

A tela deixará de exibir apenas um saldo antigo sem explicação: cada diferença será rastreável até o mês e os lançamentos que a originaram, permitindo corrigir datas ou valores diretamente no app sem criar baixas artificiais.

## Detalhes técnicos

- Concentrar a lógica de conciliação em funções puras e testáveis, evitando fórmulas duplicadas na rota.
- Normalizar nomes de plataforma e ordenar eventos por data antes de aplicar pagamentos ao saldo acumulado.
- Não alterar dados do Google Sheets durante a auditoria; somente uma ação explícita de edição/exclusão continuará gravando mudanças.
