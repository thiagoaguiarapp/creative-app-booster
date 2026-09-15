# Remover "Já pago / A pagar" do cartão de Crédito

## O que muda

Na tela Despesas, aba "Formas de pagamento", o cartão de Crédito mostra hoje dois valores extras: "Já pago" e "A pagar". Essa informação é um resquício das antigas telas de Banco/Fechamento (que foram removidas) e não deve aparecer para o usuário.

- Remover do cartão de Crédito o bloco com "Já pago" e "A pagar" (linhas 415-424 de `src/routes/despesas.tsx`).
- O cartão de Crédito passa a mostrar apenas: total, barra de percentual e quantidade de lançamentos — igual aos cartões das outras formas de pagamento.
- Nada muda nos dados nem nas outras telas; é só a retirada dessa exibição.

## Detalhes técnicos

- Arquivo: `src/routes/despesas.tsx` — remover o bloco `{g.forma === "Crédito" && (...)}` dentro do card de resumo.
- Se os cálculos `quitado`/`aberto` ficarem sem uso após a remoção, limpar também esses campos do agrupamento `porForma` para não deixar código morto.
- Validar com typecheck (`bunx tsgo --noEmit`).
