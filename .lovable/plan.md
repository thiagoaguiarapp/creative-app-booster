# Corrigir compras parceladas: valor errado, lista e edição

Três correções ligadas ao parcelamento no crédito.

## 1. Valor 100x maior (28,21 virou 2.821,50)

Conferi os lançamentos gravados. Existem duas manutenções "TROCA LONA DE FREIO TRASEIRA" com R$ 2.821,50 em cada parcela e vencimento em 2029, enquanto a versão correta da mesma compra ficou com R$ 28,22 e R$ 28,21 em 2026. O valor gravado é exatamente 100 vezes maior, o que acontece quando a vírgula digitada se perde no campo (o "56,43" entra como 5643) — e a data também foi aceita com ano inválido (há linhas gravadas como "206-10-06").

O que muda:

- O campo de valor passa a aceitar digitação em reais com vírgula e a interpretar sempre no padrão brasileiro; nada de valor multiplicado por 100.
- Datas com ano fora da faixa razoável (menor que 2000 ou maior que ano atual + 10) são recusadas com aviso, em vez de gravadas torto.
- Antes de salvar uma compra parcelada, o formulário mostra a prévia: "3x de R$ 28,21 · total R$ 84,63 · 1ª em 06/10/2026". Assim o erro aparece antes de gravar.
- Os dois lançamentos errados de 2029 podem ser corrigidos ou excluídos direto na tela de lançamentos (com as melhorias abaixo).

## 2. Lista "Todos os lançamentos"

Cada parcela continua sendo uma linha com o valor daquela parcela. O que muda é a informação em volta:

- A data mostrada na linha passa a ser a **data da compra** (é por ela que a despesa conta no mês).
- Abaixo da descrição aparece: `Parcela 2/3 de R$ 84,63 · vence 06/11/2026`.
- Nas compras à vista, nada muda.
- A marca interna `(2/3)` sai do texto da descrição, já que passa a ter lugar próprio.

## 3. Edição com os dados já preenchidos

Hoje, ao editar uma parcela, o campo "Data" mostra o vencimento e "Número de parcelas" e "Data do pagamento (vencimento)" vêm em branco. Passa a abrir assim:

- **Data**: data da compra.
- **Forma de pagamento**: já vem "Crédito parcelado" (ou "Crédito à vista").
- **Número de parcelas**: o total lido do lançamento.
- **Data do pagamento (vencimento)**: o vencimento gravado daquela parcela.
- **Observação**: só o texto que você escreveu, sem as marcas internas.

Ao salvar, apenas a parcela editada é alterada — as outras ficam como estão. O app regrava internamente as marcas de compra e de numeração.

## Detalhes técnicos

- `src/components/lancamento-form.tsx`:
  - campos `money`/`number` viram `type="text"` com `inputMode="decimal"` e parser pt-BR único (aceita `1.234,56` e `1234.56`), evitando a perda de vírgula que gerou o valor 100x.
  - validação antes de enviar: valor obrigatório > 0 e ano da data entre 2000 e ano atual + 10; erro em `toast` sem gravar.
  - prévia do parcelamento abaixo do campo "Número de parcelas".
  - `valoresIniciais`: para despesa no crédito, derivar `data` da marca `[compra ...]`, `dataPrimeiraParcela` = data gravada da linha, `parcelas` = total lido de `(n/total)`, e limpar as marcas de `descricao`.
- `src/lib/painel-write.server.ts`:
  - `paraNumero` passa a tratar separador de milhar e vírgula decimal como `num()` de `db.server`.
  - `paraBr` rejeita datas fora do formato/ano válido em vez de gravar a string crua.
  - edição (`salvarLancamento` com `row`) de despesa no crédito: `DATA` = `dataPrimeiraParcela` e `OBS` = descrição + `(n/total)` preservado + `[compra dd/mm/aaaa]`, mantendo eventual `[pago ...]`.
- `src/lib/pagamentos.ts`: expor `totalParcelas(descricao)` e limpeza da marca `(n/total)` para exibição.
- `src/routes/lancamentos.tsx`: usar a data da compra na coluna Data/ordenação das despesas e montar o detalhe com parcela, total e vencimento.
- Sem alteração de banco. Os dois registros de 2029 continuam existindo até você corrigir ou excluir.
