# Como está calculando hoje: faturamento, gorjeta e conciliação de recebimento

## 1. De onde vêm os números

- **Faturamento** vem da aba/tabela `DIARIO` (colunas `FATURAMENTO`, `APP`/`APLICATIVO`/`PLATAFORMA`, `DATA`).
- **Recebimento** vem da aba/tabela `REPASSE` (colunas `VALOR RECEBIDO`/`VALOR`, `APLICATIVO`/`APP`, `FORMA RECEBIMENTO`/`FORMA`, `DATA`).
- Ambas são lidas no servidor (`src/lib/painel.server.ts`), com cache de 30 segundos por usuário, e filtradas por `USER_ID`.

## 2. O que é considerado "extra" (gorjeta / sobra de troco)

Arquivo `src/lib/extras.ts`:

- **Gorjeta / Caixinha**: nome que começa com "GORJETA" ou "CAIXINHA".
- **Sobra de troco / Troco**: nome que começa com "SOBRA" ou "TROCO".
- Regra de negócio: esses valores **não entram na conciliação de plataformas**. Eles devem ser lançados em **Ganhos diários** (tabela `DIARIO`), com plataforma "Gorjeta" ou "Sobra troco", e nunca na tabela `REPASSE`.

Se houver algum extra ainda na aba `REPASSE`, o app mostra um alerta amarelo com o valor total.

## 3. Faturamento exibido em Recebimento / Repasse

```text
Faturado = soma de g.faturamento de todos os ganhos do período,
           excluindo os que são extras (gorjeta/sobra).
```

- Local: `src/routes/repasses.tsx`, linha 104-106.
- O faturamento usado na conciliação é só o de plataformas de entrega (iFood, Uber, 99, etc.). Gorjeta e sobra de troco ficam fora.

## 4. Gorjeta e Sobra de troco na tela Recebimento / Repasse

Aparecem em **cards próprios**:

```text
Gorjetas        = soma de g.faturamento onde plataforma for Gorjeta/Caixinha
Sobra de troco  = soma de g.faturamento onde plataforma for Sobra/Troco
```

- Local: `src/routes/repasses.tsx`, linhas 90-91.
- Eles só são contados se estiverem na tabela `DIARIO` (Ganhos diários).
- Se estiverem na tabela `REPASSE`, entram no alerta de erro, mas **não somam** nos cards.

## 5. Recebido (conciliação)

```text
Recebido = soma de r.valor de todos os repasses do período,
           excluindo os que são extras (gorjeta/sobra).
```

- Local: `src/routes/repasses.tsx`, linhas 96-100.
- O "Recebido" compara com o "Faturado" de plataformas. Por isso extras são removidos dos dois lados.

## 6. Conciliação por aplicativo

Para cada plataforma:

```text
Faturado  = soma do faturamento no período
Recebido  = soma do que entrou na aba REPASSE no período
Pendente  = Faturado - Recebido
Status    = Quitado  (pendente ≈ 0)
            Parcial  (recebido > 0 e ainda falta)
            Pendente (não recebeu nada)
```

- Local: `src/routes/repasses.tsx`, `porApp` (linhas 113-137).

## 7. Cálculo de meses anteriores (dívidas acumuladas)

A lógica central está em `src/lib/conciliacao.ts`:

1. Agrupa faturamento e recebimento por mês e por aplicativo.
2. Calcula a diferença de cada mês: `diferenca = faturado - recebido`.
3. Soma as diferenças mês a mês para cada app, criando o **saldo acumulado**:

```text
saldoAcumulado(mês atual) = saldoAcumulado(mês anterior) + diferenca(mês atual)
```

4. Se o saldo acumulado ficar positivo, é dívida. Se ficar negativo, é excesso (o app pagou mais do que devia naquele mês).

Na tela `repasses.tsx`, para o período selecionado:

```text
pendenteAnterior  = saldo acumulado positivo até o mês anterior
abatido           = quanto do recebido a mais deste mês já abateu a dívida antiga
restanteAnterior  = dívida antiga que ainda falta depois do abatimento
pendenteMes       = faturadoMes - recebidoMes (só este período)
total a receber   = pendenteMes + restanteAnterior
```

- Local: `src/routes/repasses.tsx`, `conciliacao` (linhas 149-177).

Exemplo prático:
- Mês passado: faturou R$ 1.000, recebeu R$ 800 → dívida antiga R$ 200.
- Mês atual: faturou R$ 1.000, recebeu R$ 1.100 → sobra R$ 100.
- Abatimento: R$ 100 da sobra atual paga parte da dívida antiga.
- Resultado: abatido R$ 100, ainda falta R$ 100 de meses anteriores, pendente do mês atual = 0.

## 8. Formas de recebimento (dinheiro, Pix, depósito)

As formas são lidas do campo `FORMA RECEBIMENTO` da tabela `REPASSE`. A comparação ignora maiúsculas/minúsculas e procura por palavras dentro do texto:

- **Dinheiro / Espécie**: texto contém "DINHEIRO", "ESPÉCIE" ou "ESPECIE".
- **Pix**: texto contém "PIX".
- **Depósito / Repasse do app**: texto contém "DEPOSITO", "DEPÓSITO" ou "REPASSE".

- Local: `src/routes/repasses.tsx`, linhas 201-208.

Esses valores aparecem em cards separados na tela e também no hint do card "Recebido".

## 9. Resumo visual dos cards na tela Recebimento / Repasse

| Card | Significado | Fonte |
|------|-------------|-------|
| Faturado | Faturamento das plataformas no período | `DIARIO`, sem extras |
| Recebido | Recebido das plataformas no período | `REPASSE`, sem extras |
| A receber (mês) | Faturado - Recebido do período | Cálculo local |
| A receber (meses anteriores) | Dívida acumulada de meses passados, já com abatimento | `conciliacao` |
| Gorjetas | Gorjetas/caixinha lançadas em Ganhos | `DIARIO` |
| Sobra de troco | Sobra/troco lançada em Ganhos | `DIARIO` |
| Recebido em dinheiro | Soma das formas que contêm "dinheiro/espécie" | `REPASSE` |
| Recebido em Pix | Soma das formas que contêm "pix" | `REPASSE` |

## 10. O que NÃO entra na conta

- **Valor recebido** do campo antigo `RECEBIDO` na tabela `DIARIO` foi removido. A coluna ainda existe se você não alterou o banco, mas o app não usa.
- **Gorjeta/Sobra lançada na aba REPASSE** não entra no faturamento, no recebido, nos cards de Gorjeta/Sobra, nem na conciliação. Aparece apenas no alerta de erro.
- **Despesas e abastecimento** não entram nesta tela.

## 11. Ajuste no relatório: card de Manutenção

Na tela **Relatório por período** (`src/routes/relatorio.tsx`), o card "Manutenção" está mostrando o hint "Ganho por km" (`r.lucro / r.km`). Esse hint não faz sentido para um card de custo.

### O que será feito

- Remover o hint "Ganho por km" do card de Manutenção.
- Substituir por um hint relacionado ao valor gasto, por exemplo: "Valor gasto com manutenção no período" ou deixar sem hint secundário.
- Manter o valor principal do card como `r.manutencao` (soma dos valores da tabela `MANUTENCAO` no período).

### Arquivo e local

- `src/routes/relatorio.tsx`, linha do `<StatCard label="Manutenção" ... />`.

