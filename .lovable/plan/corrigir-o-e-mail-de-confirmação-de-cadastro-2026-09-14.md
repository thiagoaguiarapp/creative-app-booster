# Corrigir o e-mail de confirmação de cadastro

Hoje, quando alguém cria conta, o e-mail de confirmação sai em inglês, cai no spam e o link leva para o site da Lovable em vez do Rota Control. São três causas diferentes, resolvidas em três frentes.

## 1. Link de confirmação levando ao site errado

No cadastro, o app não informa para onde o usuário deve voltar depois de confirmar, então é usado o endereço padrão (lovable.app).

- Passar o endereço de retorno do Rota Control no momento do cadastro e no reenvio da confirmação.
- Criar uma página nova "E-mail confirmado" que recebe o clique, conclui a entrada na conta e leva direto para a tela inicial, com mensagem de boas-vindas em português.
- Mesmo tratamento já existente para recuperação de senha continua funcionando.

## 2. E-mail em inglês

O texto atual vem pronto do serviço de contas, em inglês. A solução é o próprio Rota Control enviar o e-mail, com a sua marca e em português:

- Criar o modelo "Confirme seu e-mail" (logo, cores do app, botão "Confirmar meu e-mail", texto em português, aviso de validade do link).
- No cadastro, o app gera o link de confirmação e envia esse e-mail pela sua marca, em vez de deixar o serviço padrão enviar.
- O mesmo modelo é reaproveitado no botão "Reenviar e-mail de confirmação".

## 3. Caindo no spam

Envio pelo seu próprio domínio é o que mais melhora a entrega. O domínio `rotacontrolapp.com.br` está cadastrado, mas a verificação falhou, então hoje não é possível enviar por ele.

- Reabrir a configuração de e-mail e concluir a verificação do domínio (ajuste de DNS).
- Enquanto isso não estiver validado, o envio continua pelo serviço padrão; o item 1 (link correto) já funciona de imediato e o item 2 entra assim que o domínio validar.

## Detalhes técnicos

- `src/lib/auth.server.ts`: `cadastrar()` passa `redirect_to` para `/confirmado`; `reenviarConfirmacao()` usa o mesmo destino. Novo helper usando a chave de serviço (`admin/generate_link`, tipo `signup`) para obter o link e um `verify` no retorno.
- Novo `src/routes/confirmado.tsx`: lê o token da URL, valida a sessão via `verify`/`token`, grava os cookies de sessão e redireciona para `/`.
- Novo `src/lib/email-templates/confirmar-email.tsx` + registro em `registry.ts`; envio via `sendTemplateEmail` (`src/lib/email-templates/send-email.ts`), condicionado ao domínio verificado, com fallback silencioso para o envio padrão em caso de erro.
- `src/routes/auth.tsx`: mensagens ajustadas ("Enviamos um e-mail de confirmação…") e uso do novo destino.

## Fora do escopo

- Alterar o texto padrão em inglês do serviço de contas (não é editável pelo código; deixa de ser usado quando o item 2 entrar).
