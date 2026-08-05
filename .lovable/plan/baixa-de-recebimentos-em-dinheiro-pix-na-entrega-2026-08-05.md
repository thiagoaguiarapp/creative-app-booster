# Baixa de recebimentos em dinheiro / Pix na entrega

## Como recomendo lançar

O dinheiro/Pix recebido direto do cliente é um **recebimento**, não um faturamento novo. O faturamento já foi lançado em Ganhos diários (aba DIA A DIA) quando você fez a corrida. Então:

- A corrida entra em **Ganhos diários** (faturado, com a plataforma: iFood, Uber, 99...).
- O que entrou no bolso entra em **Recebimento / Repasse**, com o mesmo nome de plataforma e a **forma** = Dinheiro, Pix, Repasse do app, etc.

Assim a conciliação por aplicativo continua fechando sozinha: faturado − recebido = falta receber. Se você recebeu em dinheiro na entrega, o "falta receber" daquela plataforma já cai na hora.

## O que vou construir

1. **Campo "Forma de recebimento" vira menu suspenso** no formulário de repasse, com as opções: Dinheiro, Pix, Repasse do app, Cartão da maquininha, Gorjeta, Sobra de troco — mais as formas que você já usou na planilha.

2. **Botão "Dar baixa" na tabela de conciliação por aplicativo** (tela Recebimento / Repasse). Ao clicar na linha da plataforma, abre o formulário de repasse já preenchido com:
   - aplicativo daquela linha,
   - data de hoje,
   - valor = exatamente o que falta receber (editável, para baixa parcial).

3. **Nova coluna/cards por forma de recebimento** na tela Recebimento / Repasse: quanto entrou em Dinheiro, quanto em Pix e quanto veio por repasse do app, no período selecionado. Isso mostra rápido quanto do que você recebeu já estava na mão.

4. **Atalho na tela inicial**: botão "Recebi na entrega" que abre o mesmo formulário de repasse já com forma = Dinheiro e data de hoje, para lançar em 5 segundos.

5. **Status na conciliação**: cada plataforma ganha um selo — Quitado, Parcial ou Pendente — em vez de só o percentual, para bater o olho e saber o que ainda falta cair.

## Detalhes técnicos

- `src/lib/entry-schema.ts`: campo `forma` do tipo repasse ganha `sugestoes: "forma"`, com lista fixa + valores já existentes na planilha.
- `src/components/lancamento-form.tsx`: aceita `valoresIniciais` externos (pré-preenchimento) e monta o datalist de formas a partir de `data.repasses`.
- `src/routes/repasses.tsx`: botão "Dar baixa" por linha, cards por forma de recebimento e selo de status na tabela.
- `src/routes/index.tsx`: atalho "Recebi na entrega".
- Nenhuma mudança de estrutura na planilha — continua usando as colunas atuais da aba REPASSE (data, aplicativo, valor, forma).
