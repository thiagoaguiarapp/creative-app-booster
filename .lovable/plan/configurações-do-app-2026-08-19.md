# Configurações do app

## Objetivo
Criar um ícone "Configurações" logo abaixo de "Seja Premium" no menu lateral, abrindo uma tela onde o entregador edita seus dados e cadastra os veículos que usa — e esses veículos passam a ser usados nas telas que dependem de veículo (Manutenção e Abastecimento).

## O que será feito

1. **Ícone no menu lateral**
   - Novo item "Configurações" (ícone de engrenagem) no rodapé da barra lateral, imediatamente abaixo de "Seja Premium".

2. **Tela Configurações (`/configuracoes`)**
   - **Meus dados**: editar nome e WhatsApp/telefone (mesmo salvamento já usado na tela de perfil) e a meta semanal de faturamento.
   - **Meus veículos**: lista com adicionar / editar / remover. Cada veículo tem:
     - Nome/apelido (ex.: "Honda Biz 2020")
     - Placa (opcional)
     - Tipo (moto, carro, bicicleta)
     - Km atual do odômetro (opcional, só como referência)
   - Um veículo pode ser marcado como **padrão**.
   - Os veículos ficam salvos no perfil do usuário (mesmo lugar já usado para meta semanal e Premium), então acompanham a conta em qualquer aparelho.

3. **Conciliação do veículo com o app**
   - **Manutenção**: o campo "Veículo" deixa de ser texto livre e vira menu suspenso com os veículos cadastrados (mantendo os nomes já existentes nos lançamentos antigos como opções), já pré-selecionado no veículo padrão.
   - **Abastecimento**: passa a exibir/registrar o veículo do lançamento, também pré-selecionado no padrão, para que km rodado e km/L sejam calculados por veículo quando houver mais de um.
   - **Alerta de manutenção na Início e tela de Manutenção**: continuam funcionando, agora respeitando o veículo escolhido.

## Detalhes técnicos
- Nova rota `src/routes/configuracoes.tsx` com `head()` próprio.
- Veículos persistidos em `user_metadata.veiculos` via nova server function em `src/lib/auth.functions.ts` + helpers em `src/lib/auth.server.ts` (reutilizando `atualizarMetadata`), e expostos no contexto do usuário (`Usuario`/`SessaoUsuario`).
- `src/components/app-sidebar.tsx`: item no `SidebarFooter` abaixo do `PremiumDialog`.
- `src/components/lancamento-form.tsx` / `src/lib/entry-schema.ts`: campo `veiculo` como select alimentado pelos veículos cadastrados + valores históricos da base; abastecimento ganha o mesmo campo.
- Nenhuma alteração nos cálculos financeiros existentes.

## Critérios de aceitação
- Ícone "Configurações" visível abaixo de "Seja Premium" e abrindo a nova tela.
- É possível alterar nome/telefone/meta e cadastrar mais de um veículo, com um padrão.
- Ao lançar manutenção ou abastecimento, o veículo aparece como lista suspensa já preenchida com o padrão.
