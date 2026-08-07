# Organizar gorjeta e sobra de troco

Regra única: gorjeta, caixinha, sobra de troco e troco passam a ser lançados **apenas em Ganhos diários** (como faturamento, com a plataforma "Gorjeta" ou "Sobra troco"). A aba Recebimento/Repasse fica só para o que as plataformas repassam.

## O que muda

### 1. Lançamento
- Nos formulários de **ganho**, o campo Aplicativo passa a sugerir também "Gorjeta" e "Sobra troco" no menu suspenso.
- No formulário de **repasse**, as opções de extra saem das sugestões, e se o app digitado for um extra aparece um aviso: "Gorjeta e sobra de troco devem ser lançadas em Ganhos diários".
- Atalho da tela inicial "Recebi na entrega" continua igual (é repasse de plataforma, não extra).

### 2. Tela Recebimento / Repasse
- Cards **Gorjetas** e **Sobra de troco** passam a somar somente os lançamentos de Ganhos diários (sem o `Math.max` entre as duas abas).
- Se ainda existir extra lançado como repasse no período, o card mostra um alerta discreto com o valor e um link para a tela de limpeza.
- Conciliação por aplicativo continua ignorando extras.

### 3. Nova tela "Limpar duplicados"
Rota `/limpeza`, acessível pela barra lateral e pelo alerta na tela de Repasses.
- Lista todos os lançamentos de gorjeta / caixinha / sobra / troco que estão na aba **REPASSE** (o lugar errado pela nova regra), com data, aplicativo, forma e valor.
- Marca em destaque os que têm par provável em Ganhos diários (mesma data e mesmo valor) — esses são a duplicidade real.
- Cada linha tem botões **Editar** e **Excluir** (mesmos já usados no resto do app), e há um resumo no topo: quantos registros, quanto somam, quantos parecem duplicados.
- Exclusão é feita uma a uma, com confirmação, para evitar apagar algo por engano.

## Detalhes técnicos

- `src/lib/entry-schema.ts`: incluir "Gorjeta" / "Sobra troco" nas sugestões de plataforma do ganho; remover das sugestões de repasse.
- `src/components/lancamento-form.tsx`: aviso inline quando o campo aplicativo de um repasse casar com o padrão de extra.
- Extrair o teste de extra (`ehExtra`/`ehGorjeta`/`ehSobra`, hoje duplicado em `src/routes/repasses.tsx`) para `src/lib/extras.ts` e reutilizar nas duas telas.
- `src/routes/repasses.tsx`: gorjetas/sobra vêm só de `data.ganhos`; adicionar aviso quando houver extras em `data.repasses`.
- Nova rota `src/routes/limpeza.tsx` usando `painelQueryOptions()` e `AcoesLancamento` (tipo `repasse`); pareamento por `iso` + valor arredondado a 2 casas.
- `src/components/app-sidebar.tsx`: novo item de navegação.
- Sem mudança na planilha nem na camada de escrita.
