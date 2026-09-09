# Banco e Fechamento só no Premium

## Resposta sobre os valores

As telas Banco e Fechamento não guardam nada próprio: elas apenas somam os lançamentos que você já registra (despesas, abastecimentos, ganhos, repasses, manutenções). Quem está no plano Free continua lançando tudo normalmente — só não enxerga essas duas telas.

No momento em que a pessoa vira Premium, as telas abrem já com todo o histórico: meses anteriores, extrato, faturas do cartão, o que foi pago e o que está em aberto. Nada nasce zerado e nada precisa ser recadastrado.

Única exceção: a marcação "mês conferido" do Fechamento fica guardada no próprio aparelho e só passa a existir a partir do primeiro clique.

## O que muda

1. Os atalhos "Banco" e "Fechamento do mês" somem da barra inferior, da linha de ícones e do menu lateral para quem está no Free.
2. Se alguém abrir o endereço dessas telas direto, é levado para a tela de assinatura, sem prévia e sem valores.
3. Assim que o plano vira Premium, os dois atalhos reaparecem e as telas mostram todo o histórico.
4. A tela Premium ganha a menção dessas duas telas na lista de benefícios.

## Detalhes técnicos

- `src/components/atalho-paginas.tsx` e `src/components/app-sidebar.tsx`: ler `useRouteContext({ from: "__root__" }).usuario?.isPremium` e filtrar as entradas `/banco` e `/fechamento` quando falso.
- `src/routes/banco.tsx` e `src/routes/fechamento.tsx`: no `beforeLoad`, checar o mesmo `context.usuario?.isPremium` e lançar `redirect({ to: "/premium" })` quando falso, antes do `loader` disparar a query do painel.
- `/pagamentos` já redireciona para `/banco`, então herda a regra.
- `src/routes/premium.tsx`: acrescentar um benefício citando Banco (extrato e cartão) e Fechamento do mês.
- Nenhuma mudança em dados, migração ou cálculo — os valores continuam derivados dos lançamentos existentes.
