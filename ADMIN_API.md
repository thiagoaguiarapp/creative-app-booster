# Integração administrativa do No Corre

## Endereços

- Resumo sem dados pessoais: `https://nocorre.rotacontrolapp.com.br/api/public/admin`
- Resumo completo e últimos 100 usuários: `https://nocorre.rotacontrolapp.com.br/api/admin`

Ambos exigem `Authorization: Bearer <valor de NOCORRE_ADMIN_TOKEN>`. O valor deve ficar somente no armazenamento de segredos dos dois projetos, nunca em código, navegador, chat ou URLs. O portal deve autenticar seu administrador e chamar a API no servidor, não diretamente do navegador. CORS não substitui autenticação; só `https://www.rotacontrolapp.com.br` recebe permissão de origem. Chamadas servidor a servidor sem Origin são aceitas mediante token válido.

`/api/admin` também fica sujeito à proteção de acesso do site publicado. Se o site exigir login de visitante na hospedagem, o token da aplicação não contorna essa proteção. Verifique a chamada publicada pelo servidor do portal antes da entrada em produção; não libere dados pessoais pelo prefixo público para contornar isso.

## GET

Retorna `totalUsuarios`, `cadastrosMes`, `ativos7d`, `premium`; na rota protegida também `usuarios`, com `id`, `nome`, `email`, `plano` (`premium` ou `free`), `bloqueado` e `criadoEm` (ISO).

O mês é civil em America/Sao_Paulo. Ativos 7d significa último login nos últimos sete dias, não atividade em telas. Premium é o acesso atualmente marcado no cadastro, incluindo concessões administrativas; não é receita, assinatura paga confirmada nem número de assinaturas da Google Play/RevenueCat. Todas as páginas de usuários são consultadas para os totais; apenas a lista é limitada aos 100 cadastros mais recentes. Falhas do serviço retornam erro, nunca totais parciais silenciosos.

## POST

JSON com UUID `userId`, `acao` e `motivo` obrigatório (1–1000 caracteres, sem espaços isolados):

```json
{"userId":"11111111-1111-4111-8111-111111111111","acao":"premium","motivo":"Concessão aprovada no atendimento"}
```

Ações: `premium`, `removerPremium`, `bloquear`, `desbloquear`. São comandos explícitos, não alternâncias, para evitar inverter o estado em retries. Não bloqueia nem remove Premium de contas administrativas. Alterar Premium concede/remove acesso no app; não compra/cancela cobrança na loja. A última ação, motivo, data e origem são gravados em `app_metadata` junto com a alteração; isso não constitui histórico completo ou identificação individual do operador do portal.

Respostas: 200 `{ "ok": true }`, 400 dados inválidos, 401 token inválido, 403 origem/ação negada, 413 corpo acima de 8KB, 415 formato não JSON, 502 serviço indisponível, 503 token não configurado. OPTIONS permitido somente à origem e métodos/cabeçalhos declarados. Respostas não podem ser armazenadas em cache.

## Publicação e validação

1. Cadastrar o mesmo token nos dois projetos com o formulário seguro.
2. Implementar a página administrativa e chamada de servidor no projeto do portal.
3. Publicar No Corre e testar GET pelo servidor do portal.
4. Confirmar alterações em uma conta de teste autorizada e a leitura do novo estado.

Contas e dados continuam no serviço existente `MOTOCA_*`. Lovable Cloud não migrou os usuários. A antiga credencial privilegiada fixa removida de `admin.server.ts` deve ser rotacionada no provedor original; arquivos anteriores e outros módulos existentes também devem ser revisados antes de afirmar que não há credenciais fixas no projeto.