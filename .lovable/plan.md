# Página inicial pública (web) + app continua no login

## Objetivo

Hoje a rota `/` é o painel do app (exige login). A ideia: quem acessa **pelo site** vê uma página de apresentação do Rota Control; quem abre o **app Android** continua caindo direto na tela de login, como hoje.

## O que muda

### 1. Nova página de apresentação em `/` (somente web)
- Reescrever `src/routes/index.tsx` como página pública de divulgação:
  - Topo com logo e botões "Entrar" e "Criar conta"
  - Seção principal: nome do app, frase de impacto e chamada para cadastro
  - Blocos de funcionalidades: ganhos por plataforma, abastecimento, despesas parceladas, manutenção por km com alertas, repasses, relatórios por período
  - Bloco sobre o plano Premium (link para `/premium`)
  - Rodapé com Termos de Uso e Política de Privacidade
- SEO próprio: título, descrição, og:title/og:description voltados a visitantes novos.

### 2. Painel atual muda para `/inicio`
- Mover todo o conteúdo atual de `src/routes/index.tsx` (resumo do dia, meta semanal, alertas de manutenção, últimos lançamentos) para `src/routes/inicio.tsx` (rota `/inicio`), sem alterar o visual.
- Atualizar links que apontam para o painel:
  - `src/components/app-sidebar.tsx` — item "Início" → `/inicio`
  - `src/components/atalho-paginas.tsx` — atalho "Início" → `/inicio`
  - `src/routes/auth.tsx`, `src/routes/confirmado.tsx`, `src/routes/redefinir-senha.tsx`, `src/routes/perfil.tsx`, `src/routes/premium.tsx` — redirecionamentos pós-login → `/inicio`

### 3. Regras de acesso em `src/routes/__root.tsx`
- `/` passa a ser rota pública **apenas na web** (visitante sem login vê a apresentação).
- No app Android (Capacitor nativo), `/` sem login continua redirecionando para `/auth` — comportamento atual preservado.
- Usuário já logado que abrir `/` é levado ao painel `/inicio`.

## Como decide web vs Android
- Uso de `Capacitor.isNativePlatform()`: no app instalado, nada muda; no navegador, a página de apresentação aparece.

## Detalhes técnicos
- Arquivos novos/alterados: `src/routes/index.tsx` (reescrever), `src/routes/inicio.tsx` (novo, conteúdo movido), `src/routes/__root.tsx` (guard), `src/components/app-sidebar.tsx`, `src/components/atalho-paginas.tsx`, `src/routes/auth.tsx`, `src/routes/confirmado.tsx`, `src/routes/redefinir-senha.tsx`, `src/routes/perfil.tsx`, `src/routes/premium.tsx`.
- Nada muda no banco de dados nem nas regras de acesso aos dados.
- Validação: typecheck + conferência visual da landing e do redirecionamento no preview.
