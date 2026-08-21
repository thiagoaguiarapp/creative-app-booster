# Testes automatizados da conciliação de repasses

## Objetivo

Travar por teste a regra nova de baixa (dívida mais antiga primeiro) para que uma mudança futura não volte a mostrar iFood e Uber como pendência de meses anteriores.

## O que será feito

1. Adicionar o Vitest ao projeto (dependência de desenvolvimento, configuração mínima e script `test`), sem alterar o funcionamento do app.
2. Criar um arquivo de testes para as funções de conciliação com estes casos:
   - **Mais antigo primeiro**: faturamento em maio e junho, um único repasse em junho menor que a soma — o teste garante que a baixa quita maio antes de junho.
   - **iFood zera meses anteriores**: cenário com dívida acumulada até julho e repasse maior em agosto — "ainda falta de meses anteriores" deve ser 0 e a diferença deve ficar no mês atual.
   - **Uber zera meses anteriores**: mesmo cenário, com valores menores.
   - **Zuply mantém pendência antiga**: sem recebimento no mês atual, a pendência antiga continua aparecendo.
   - **Saldo total não muda**: para cada plataforma, faturado − recebido do histórico continua igual, independentemente de como a baixa é distribuída.
   - **Gorjeta e sobra de troco ficam fora** da conciliação.
3. Rodar a suíte e confirmar que todos os casos passam.

## Detalhes técnicos

- Instalar `vitest` como devDependency e criar `vitest.config.ts` com `vite-tsconfig-paths` para resolver o alias `@/`.
- Testes em `src/lib/conciliacao.test.ts`, usando dados fixos em memória (nenhum acesso ao banco), cobrindo `quitacaoPorApp` e `saldoPorPlataforma`.
- Reproduzir no teste o mesmo recorte usado na tela: `quitacaoPorApp(ganhos, repassesAteOCorte, iso => iso < corte)` para "pendente antigo" e `quitacaoPorApp(ganhos, todosOsRepasses, iso => iso < corte)` para "ainda falta".
- Adicionar `"test": "vitest run"` em `package.json`. Nenhuma alteração em código de produção.
