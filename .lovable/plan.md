# Menu "+ Novo lançamento" no celular

## O que o print mostrou

Abri o app em tela de celular (390x844) e toquei em "+ Novo lançamento". O menu abre como uma janela centralizada escura com o título "Novo lançamento", o subtítulo "Escolha o que você quer registrar" e cartões grandes com nome + descrição:

```text
Novo lançamento                    [X]
Escolha o que você quer registrar.
 ┌───────────────────────────────┐
 │ Ganho diário                +│
 │ Corridas e faturamento        │
 ├───────────────────────────────┤
 │ Abastecimento               +│
 │ Litros e odômetro             │
 ├───────────────────────────────┤
 │ Despesa                     +│
 │ Custos operacionais           │
 ├───────────────────────────────┤
 │ Repasse / recebimento       +│
 │ Valores recebidos             │
 └───────────────────────────────┘
        (Manutenção fica cortada)
```

Problema encontrado: no celular a janela fica **cortada na parte de baixo** — a opção "Manutenção" não aparece e não há rolagem dentro do menu. Também é uma janela centralizada, formato pouco confortável para o polegar em modo app.

## Ajustes propostos

1. **Corrigir o corte**: limitar a altura do menu à tela e permitir rolagem interna, garantindo que as 5 opções (incluindo Manutenção) sempre apareçam.
2. **Formato de app no celular**: no celular o menu passa a subir de baixo para cima (folha deslizante), com uma alça no topo e cantos arredondados; no computador continua como janela centralizada.
3. **Toque mais confortável**: cartões com altura mínima adequada ao dedo, espaçamento levemente maior e ícone próprio de cada tipo (moto, bomba, recibo, carteira, chave) à esquerda, no lugar do "+" repetido.
4. **Fechar mais fácil**: além do X, tocar fora ou arrastar a folha para baixo fecha o menu.

## Detalhes técnicos

- Arquivo: `src/components/lancamento-form.tsx` (componente `NovoLancamentoRapido`).
- Usar `useIsMobile()` (`src/hooks/use-mobile.tsx`) para escolher entre `Sheet` (`side="bottom"`) no celular e `Dialog` no desktop; o conteúdo da lista de opções vira um componente compartilhado.
- Conteúdo com `max-h-[85dvh] overflow-y-auto` e `pb-[env(safe-area-inset-bottom)]`.
- Ícones vindos do `lucide-react` já usados em `src/components/atalho-paginas.tsx`, mantendo o mesmo vocabulário visual.
- Sem mudança em dados, cálculos ou no fluxo de salvamento dos formulários.

## Critérios de aceitação

- No celular as 5 opções aparecem (com rolagem quando necessário), nenhuma cortada.
- O menu abre de baixo para cima no celular e continua janela centralizada no desktop.
- Abrir cada opção continua levando ao formulário correspondente sem regressão.
