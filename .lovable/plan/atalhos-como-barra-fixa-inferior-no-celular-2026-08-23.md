# Atalhos como barra fixa inferior no celular

## Objetivo
No celular, os ícones de atalho deixam de ficar no meio da tela e passam a formar uma barra fixa na parte de baixo (estilo app). No computador, tudo continua como está hoje: a linha de ícones aparece abaixo do título.

## Como vai funcionar

1. **Celular (até 768px)**
   - Barra fixa na base da tela, sempre visível, com fundo escuro, leve desfoque e borda superior.
   - Ícones em linha com rolagem horizontal suave (são 8 telas), cada um com rótulo curto embaixo.
   - O ícone da tela atual fica destacado (cor de destaque).
   - Área de toque confortável e respeito à faixa de gestos do celular (safe area).
   - As páginas ganham um espaço extra no rodapé para nada ficar escondido atrás da barra.

2. **Computador**
   - Mantém a linha de ícones centralizada abaixo do título, exatamente como hoje.

3. **Botões de lançamento**
   - Continuam no mesmo lugar em cada tela (abaixo do título), sem mudança.

## Detalhes técnicos
- `src/components/atalho-paginas.tsx`: passa a renderizar duas variantes usando classes responsivas — `hidden md:flex` para a linha atual e um `<nav>` `fixed bottom-0 inset-x-0 z-40 md:hidden` para a barra inferior, com `pb-[env(safe-area-inset-bottom)]` e `overflow-x-auto`.
- Rótulos curtos por item (Início, Ganhos, Abastec., Despesas, Repasse, Manut., Relatório, Todos) adicionados na lista de páginas existente.
- Estado ativo continua via `useRouterState` comparando `pathname`.
- Espaçamento inferior global: `pb-24 md:pb-8` no `<main>` de `src/routes/__root.tsx`.
- Sem mudanças em dados, cálculos ou formulários.

## Critérios de aceitação
- No celular a barra de ícones fica fixa embaixo em todas as telas e destaca a tela atual.
- Nenhum conteúdo fica escondido atrás da barra.
- No desktop o layout permanece inalterado.
