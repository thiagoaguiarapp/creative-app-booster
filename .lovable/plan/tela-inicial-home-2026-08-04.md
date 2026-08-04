# Tela inicial (Home)

## Objetivo
Criar uma tela inicial de boas-vindas que mostre o resumo do dia de hoje, acesso rápido às principais ações e atalhos para as outras telas. A página atual de "Ganhos diários" será movida para uma rota própria (`/ganhos-diarios`) para não perder a funcionalidade.

## O que será feito

1. **Nova rota `/` — Home**
   - Saudação personalizada com base no horário do dia.
   - Resumo do dia de hoje em cards:
     - Faturamento de hoje (soma dos ganhos com `data === hoje`).
     - Corridas de hoje.
     - Despesas de hoje.
     - Abastecimento de hoje (litros / valor).
   - Comparativo simples com ontem (variação percentual ou valor absoluto) quando houver dados.
   - Botões de ação rápida: "Novo ganho", "Novo abastecimento", "Nova despesa", "Novo repasse".
   - Atalhos em cards para as telas: Ganhos diários, Abastecimento, Despesas, Recebimento/Repasse, Manutenção, Relatório, Todos os lançamentos.
   - Lista dos últimos 5 lançamentos de qualquer tipo feitos hoje.

2. **Mover "Ganhos diários" para `/ganhos-diarios`**
   - Renomear/criar `src/routes/ganhos-diarios.tsx` com o conteúdo atual de `src/routes/index.tsx`.
   - Ajustar `createFileRoute("/ganhos-diarios")` e metadados.
   - Atualizar sidebar: item "Ganhos diários" passa a apontar para `/ganhos-diarios`.

3. **Ajustes de navegação**
   - Atualizar `src/components/app-sidebar.tsx` com a nova URL de Ganhos diários.
   - Adicionar item "Início" no topo do menu apontando para `/`.
   - Atualizar `src/routes/__root.tsx`: metadados padrão da home (título, descrição, OG).

4. **Dados**
   - Reutilizar `painelQueryOptions()` já existente; a home filtra os arrays em memória pelo `iso` de hoje (`YYYY-MM-DD`).
   - Nenhuma nova função de servidor ou alteração no Google Sheets será necessária.

## Estrutura de rotas resultante

```text
/                    -> Home (boas-vindas + resumo do dia)
/ganhos-diarios      -> Ganhos diários (conteúdo atual de /)
/abastecimento       -> Abastecimento
/despesas            -> Despesas
/repasses            -> Recebimento / Repasse
/manutencao          -> Manutenção
/relatorio           -> Relatório
/lancamentos         -> Todos os lançamentos
```

## Critérios de aceitação
- Acessar `/` mostra a nova home com saudação e resumo do dia.
- O botão/card "Ganhos diários" leva para `/ganhos-diarios` e a página carrega normalmente.
- Sidebar exibe "Início" e "Ganhos diários" com URLs corretas.
- Botões de ação rápida na home abrem os mesmos formulários de lançamento usados nas outras telas.
- Metadados da home são atualizados (título, descrição, OG).
