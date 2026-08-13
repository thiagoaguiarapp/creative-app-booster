# Ícones de atalho em todas as telas

## Objetivo
Repetir o bloco de atalhos da tela Início (linha de ícones para todas as páginas) em todas as demais telas, mantendo em cada uma o botão de novo lançamento correspondente àquela tela.

## O que será feito

1. **Bloco de atalhos padrão**
   - Reutilizar o componente `AtalhoPaginas` (`src/components/atalho-paginas.tsx`) logo abaixo do título de cada página, na mesma ordem usada na Início: ícones primeiro, botão de lançamento em seguida.
   - O ícone da página atual fica destacado (variante preenchida) para indicar onde o usuário está.

2. **Telas com botão fixo**
   - Ganhos diários → botão "Lançar ganho"
   - Abastecimento → "Lançar abastecimento"
   - Despesas → "Lançar despesa"
   - Recebimento / Repasse → "Lançar repasse"
   - Manutenção → "Lançar manutenção"
   - Relatório → sem botão de lançamento (tela só de consulta), apenas os ícones.

3. **Tela "Todos os lançamentos"**
   - Mantém o comportamento atual: o botão muda conforme o tipo selecionado nos filtros.
   - Quando o filtro estiver em "Todos", exibir o botão "+ Novo lançamento" com o menu de opções (mesmo da Início), em vez de nenhum botão.

## Detalhes técnicos
- Arquivos alterados: `src/components/atalho-paginas.tsx` (destaque da rota ativa via `useRouterState`/`Link` activeProps), `src/routes/ganhos-diarios.tsx`, `abastecimento.tsx`, `despesas.tsx`, `repasses.tsx`, `manutencao.tsx`, `relatorio.tsx`, `lancamentos.tsx`.
- O botão de lançamento sai do slot `action` do `PageHeader` nessas telas e passa para a linha de atalhos, igual à Início.
- Sem mudanças de dados ou lógica de cálculo.

## Critérios de aceitação
- Toda tela mostra a linha de ícones de navegação abaixo do título.
- O botão ao lado corresponde ao tipo de lançamento da tela.
- Em "Todos os lançamentos" o botão continua trocando conforme o filtro e mostra o menu geral quando o filtro é "Todos".
