# Plano: campo "Combustível utilizado" no abastecimento

## Situação atual
O formulário de abastecimento tem apenas um campo de texto livre "Posto / combustível (opcional)" — não existe um campo separado para escolher o tipo de combustível. Por isso a lista "Combustíveis / postos" do painel admin aparece só como sugestão misturada nesse campo.

## O que será feito

### 1. Novo campo "Combustível"
- Adicionar em `src/lib/entry-schema.ts` (tipo `abastecimento`) um campo **select** `combustivel` com opções padrão: Gasolina, Gasolina aditivada, Etanol, GNV, Diesel, Flex (tanque cheio).
- Renomear o campo atual `posto` para ficar claro: "Posto (opcional)" — mantém as sugestões da lista do admin.
- A lista "Combustíveis / postos" do painel admin passa a alimentar **as duas** sugestões: tipo de combustível e posto.

### 2. Gravação e exibição
- `src/lib/painel-write.server.ts`: salvar o combustível junto ao abastecimento (na coluna própria se existir, senão concatenado à observação/posto, ex.: "Posto X · Gasolina").
- Tela **Abastecimento**: exibir o combustível em cada lançamento da lista.
- Edição: ao abrir um abastecimento, o combustível salvo já vem selecionado (mesma lógica case-insensitive usada na forma de pagamento).

### 3. Cálculo de consumo (km/L)
- Sem alteração de fórmula — o combustível vira informação registrada e exibida; se desejar, pode-se futuramente comparar km/L por tipo de combustível.

## Arquivos tocados
- `src/lib/entry-schema.ts` (novo campo + rótulo do posto)
- `src/lib/painel-write.server.ts` (gravar combustível)
- `src/components/lancamento-form.tsx` (se necessário, sugestões)
- `src/routes/abastecimentos.tsx` (exibir combustível na lista)

## Verificação
- `bunx tsgo --noEmit` sem erros.
- Teste no preview: lançar abastecimento com combustível, editar, ver na lista e na tela Pagamentos sem quebrar nada.
