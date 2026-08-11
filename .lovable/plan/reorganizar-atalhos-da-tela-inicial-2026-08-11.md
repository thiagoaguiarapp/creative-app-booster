# Reorganizar atalhos da tela inicial

## Objetivo
Na tela inicial, reposicionar a fileira de atalhos para as telas do menu lateral, deixando os **ícones primeiro** e o botão **"+ Novo lançamento" por último**, logo **abaixo da saudação ("Boa tarde")**.

## Contexto verificado
- O card "Faturamento da semana" já foi removido em versões anteriores e não existe mais no build atual. A Home mostra apenas: aviso de Manutenção, card "Meta semanal" (mantido) e a tabela "Últimos lançamentos da semana".
- A fileira atual (ícones de atalho + botão "+ Novo lançamento") já existe, mas aparece depois do aviso de Manutenção, com o botão primeiro e os ícones depois.

## Mudanças (arquivo: `src/routes/index.tsx`)
1. Mover o bloco com `AtalhoPaginas` + `NovoLancamentoRapido` para **logo abaixo do `<PageHeader>`** (a saudação "Boa tarde"), antes do aviso de Manutenção.
2. Inverter a ordem dentro da fileira: **ícones de atalho primeiro**, **botão "+ Novo lançamento" por último**.
3. Ajustar o layout responsivo:
   - Mobile: empilhar verticalmente — ícones de atalho em linha (que pode quebrar linha), botão "+ Novo lançamento" abaixo ocupando a largura total.
   - Desktop: ícones de atalho seguidos do botão na mesma linha.

## Fora do escopo
- Nenhuma remoção de card — "Meta semanal" e "Últimos lançamentos" permanecem como estão.
- Nenhuma mudança no menu lateral.
