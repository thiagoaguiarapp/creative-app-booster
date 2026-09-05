# Plano — Tela Fluxo de Caixa Mensal

## Objetivo
Nova tela `/fluxo-caixa` que consolida por mês: **entradas** (ganhos + repasses recebidos), **saídas** (despesas + abastecimentos, pela data de pagamento real), **saldo** do mês, **o que falta pagar** (fatura do cartão e parcelas futuras) e **o que falta receber** (repasses em aberto). Com filtro de período.

## O que o usuário verá
- Filtro de período: **Mês atual / Mês passado / Últimos 3 meses / Últimos 6 meses / Total** (mesmo padrão das outras telas).
- Cards-resumo do período: Entradas, Saídas, Saldo, Falta pagar (crédito a vencer) e Falta receber (repasses pendentes).
- Tabela/lista mês a mês com: entradas, saídas, saldo, fatura do cartão no mês e repasses em aberto; saldo negativo destacado em vermelho.
- Gráfico de barras simples (entradas x saídas por mês) usando o padrão visual já usado em Ganhos Diários.
- Expansão de cada mês mostrando detalhes: entradas por plataforma e saídas por forma de pagamento.
- Atalho na Home e item no menu.

## Regras de data (consistente com o que já existe)
- **Entradas**: ganhos pela data do lançamento; repasses pela data de recebimento/baixa.
- **Saídas à vista** (dinheiro, Pix, débito): pela data do lançamento.
- **Saídas no crédito**: pela **data de vencimento da parcela** (mesma regra da tela Pagamentos — `montaPagamentos`/`faturaPorMes`).
- **Falta pagar**: parcelas de crédito com vencimento futuro + fatura do mês corrente.
- **Falta receber**: repasses sem baixa (conciliação pendente).

## Detalhes técnicos
- Nova rota `src/routes/fluxo-caixa.tsx` com `head()` próprio ("Fluxo de Caixa — Rota Control") e `Shell`.
- Novo módulo `src/lib/fluxo-caixa.ts`: funções puras que recebem `PainelData` e agregam por mês (reutilizando `montaPagamentos`, `faturaPorMes`, `parcelasEmAberto`, `somaMeses`, `rotuloMes` de `src/lib/pagamentos.ts`; ganhos/repasses de `loadPainelData`).
- Dados via a query existente do painel (cache SWR), sem novas leituras ao banco.
- Atalhos: adicionar ícone em `src/routes/index.tsx` e no menu de navegação (`src/components/shell.tsx`).
- Otimizado para mobile (mesmo padrão das telas Pagamentos/Relatórios).
- Verificação: `bunx tsgo --noEmit`.
