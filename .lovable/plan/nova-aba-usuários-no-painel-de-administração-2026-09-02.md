# Nova aba "Usuários" no painel de Administração

Hoje a lista de usuários fica misturada na aba "Visão geral", junto com métricas e categorias. A ideia é dar a ela uma aba própria.

## O que muda

1. Nova aba **Usuários** na barra do `/admin`, ao lado de "Visão geral" e "Relatórios" (rota `/admin/usuarios`).
2. A tabela de usuários sai da "Visão geral" e passa para a nova aba. A visão geral fica só com os cards de métricas, lançamentos por módulo e categorias padrão.
3. Na nova aba, a lista ganha:
   - Campo de busca por nome ou e-mail.
   - Filtros rápidos: Todos, Premium, Free, Pendentes de confirmação, Administradores.
   - Cards de resumo no topo: total de contas, premium, pendentes.
   - Colunas: usuário (nome, e-mail, marcação de admin), status, plano, cadastro e último acesso.
4. Layout mobile: cada usuário vira um card empilhado (nome + e-mail em destaque, status/plano/datas abaixo), seguindo o padrão já usado nas outras telas.

## Detalhes técnicos

- Novo arquivo `src/routes/admin.usuarios.tsx` com `createFileRoute("/admin/usuarios")`, reaproveitando `resumoAdminFn` (mesma query key `admin-resumo`, sem chamadas extras ao banco).
- `src/routes/admin.tsx`: adicionar a entrada `{ to: "/admin/usuarios", rotulo: "Usuários" }` no array `ABAS`.
- `src/routes/admin.index.tsx`: remover o `SectionCard` "Usuários"; manter os StatCards (o card "Usuários cadastrados" continua e pode servir de atalho).
- Busca e filtros feitos em memória sobre `data.usuarios`; nenhuma mudança em server functions, schema ou políticas.
- `head()` próprio na rota com título e descrição específicos da aba.
