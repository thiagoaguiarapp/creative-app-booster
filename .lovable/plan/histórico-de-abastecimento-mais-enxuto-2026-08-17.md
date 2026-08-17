# Histórico de Abastecimento mais enxuto

## Objetivo
Na tela Abastecimento, a tabela de histórico tem 10 colunas e fica poluída (principalmente no celular). Vamos deixar à vista só o essencial e esconder o resto num submenu que abre ao tocar na linha.

## O que fica à vista
Colunas principais na linha:
- Data
- Litros
- Total pago
- km/L
- Seta de expandir

## O que vai para o submenu (expandir a linha)
Ao tocar na linha, abre um painel logo abaixo com:
- Posto
- Forma de pagamento
- Preço por litro (R$/L)
- Desconto
- Odômetro
- Botões de Editar/Excluir (Ações)

## Comportamento
- Uma linha aberta por vez; tocar de novo fecha.
- Sem mudança em cálculos, filtros de período ou nos cards de resumo.
- Mesmo layout no celular e no desktop, com os detalhes em grade de 2 colunas no celular.

## Detalhes técnicos
- Alterar apenas `src/routes/abastecimento.tsx`.
- Estado local `abertoId` controlando a linha expandida; linha extra `<TableRow>` com `colSpan` para os detalhes.
- Reaproveitar `AcoesLancamento` dentro do painel expandido.
