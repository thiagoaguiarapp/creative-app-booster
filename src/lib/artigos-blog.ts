export interface ArtigoBlog {
  slug: string;
  titulo: string;
  descricao: string;
  data: string;
  tempoLeitura: string;
  conteudo: string[]; // parágrafos; linhas começando com "## " viram subtítulos
}

export const ARTIGOS_BLOG: ArtigoBlog[] = [
  {
    slug: "quanto-ganha-entregador-de-verdade",
    titulo: "Quanto um entregador realmente ganha? A conta que quase ninguém faz",
    descricao:
      "Faturamento não é lucro. Aprenda a descontar combustível, manutenção e depreciação para descobrir quanto sobra de verdade no fim do mês.",
    data: "2026-09-10",
    tempoLeitura: "6 min",
    conteudo: [
      "É comum ouvir: \"faturei R$ 4.000 este mês no iFood\". Mas faturamento não é salário. Entre o valor que aparece no app e o dinheiro que realmente fica no bolso existe uma distância grande — e quem não faz essa conta pode estar trabalhando no prejuízo sem perceber.",
      "## Os custos invisíveis da roda",
      "O primeiro custo é o combustível, que todo mundo sente no dia a dia. Mas existem outros três que passam despercebidos: a manutenção (óleo, pneus, relação, pastilha), a depreciação do veículo (cada km rodado reduz o valor de revenda) e os custos fixos (seguro, IPVA, licenciamento, celular e internet).",
      "Uma moto que roda 200 km por dia útil percorre mais de 4.000 km por mês. Com consumo de 35 km/l e gasolina a R$ 5,80, são cerca de R$ 660 só de combustível. Some R$ 150 a R$ 250 de manutenção proporcional e a depreciação, e o custo real por km facilmente passa de R$ 0,35.",
      "## A conta certa",
      "Lucro real = faturamento bruto − combustível − manutenção − despesas fixas − taxas das plataformas. Só depois dessa subtração você sabe quanto ganhou por hora trabalhada.",
      "É exatamente para isso que o Rota Control existe: você lança os ganhos por plataforma, os abastecimentos e as despesas, e o app mostra o lucro líquido por dia, semana e mês — sem planilha complicada.",
      "## Dica prática",
      "Comece medindo seu custo por quilômetro. Com ele em mãos, você consegue avaliar se uma corrida de R$ 8 por 6 km vale a pena ou se é melhor esperar a próxima. Quem conhece o próprio custo negocia melhor com o próprio tempo.",
    ],
  },
  {
    slug: "como-calcular-custo-por-km",
    titulo: "Como calcular o custo por km da sua moto (passo a passo)",
    descricao:
      "O custo por km é o número mais importante de quem trabalha com veículo próprio. Veja como calcular em 5 minutos e use nossa calculadora gratuita.",
    data: "2026-09-14",
    tempoLeitura: "5 min",
    conteudo: [
      "Saber quanto custa cada quilômetro rodado é o que separa o entregador que lucra do que apenas gira. O cálculo é simples e você faz uma vez por mês.",
      "## Passo 1: meça o consumo real",
      "Encha o tanque e zere o odômetro parcial (ou anote o km total). Rode normalmente até o próximo abastecimento. Encha o tanque de novo e divida os km rodados pelos litros que entraram. Esse é seu consumo real, que quase sempre é diferente do que o fabricante anuncia.",
      "## Passo 2: calcule o custo do combustível por km",
      "Divida o preço do litro pelo consumo. Exemplo: R$ 5,80 ÷ 35 km/l = R$ 0,166 por km.",
      "## Passo 3: some manutenção e depreciação",
      "Pegue tudo que você gastou com a moto nos últimos 6 meses (óleo, pneus, peças, mão de obra) e divida pelos km rodados no período. Para a depreciação, uma estimativa conservadora é R$ 0,08 a R$ 0,15 por km para motos de baixa cilindrada.",
      "## Passo 4: use o número no dia a dia",
      "Com o custo por km em mãos, avalie cada corrida: valor da corrida ÷ distância total (ida ao restaurante + entrega) precisa ser bem maior que o seu custo. Abaixo de 2x o custo por km, a corrida quase não deixa lucro.",
      "Quer pular a matemática? Use a Calculadora de Custo por KM gratuita aqui no site ou deixe o Rota Control calcular tudo automaticamente a cada abastecimento.",
    ],
  },
  {
    slug: "organizar-repasses-plataformas",
    titulo: "iFood, 99, Uber: como organizar os repasses e nunca perder dinheiro",
    descricao:
      "Cada plataforma paga em um dia e desconta taxas diferentes. Veja como conciliar o que você faturou com o que realmente caiu na conta.",
    data: "2026-09-20",
    tempoLeitura: "7 min",
    conteudo: [
      "Quem roda em mais de um aplicativo conhece o problema: o iFood paga em uma data, a 99 em outra, a Uber em outra — e nem sempre o valor depositado bate com o que você acha que faturou. Sem controle, dinheiro some e você nem percebe.",
      "## Por que os valores não batem",
      "As plataformas descontam taxas de repasse ou adiantamento, estornos de pedidos cancelados e valores que você já recebeu em dinheiro ou Pix direto do cliente. Se você entregou um pedido de R$ 40 e recebeu em dinheiro, a plataforma desconta esses R$ 40 do repasse — quem não anota acha que a plataforma \"pagou errado\".",
      "## O método da conciliação simples",
      "Para cada plataforma, controle três números: quanto você faturou, quanto já recebeu em mãos (dinheiro/Pix na entrega) e quanto a plataforma depositou. A diferença entre faturado e recebido é o que a plataforma ainda te deve.",
      "No Rota Control, isso é automático: você lança o ganho por plataforma, registra o que recebeu em mãos no próprio lançamento rápido e dá baixa quando o repasse cai. Se a plataforma cobrou taxa de repasse, o app já lança a taxa como despesa e a conta fecha no centavo.",
      "## Reserve um dia da semana para conferir",
      "Escolha um dia fixo (sexta-feira funciona bem) para comparar o extrato bancário com os repasses previstos. Dez minutos por semana evitam surpresas no fim do mês.",
    ],
  },
  {
    slug: "manutencao-preventiva-moto-entregador",
    titulo: "Manutenção preventiva da moto: o calendário que salva o seu ganha-pão",
    descricao:
      "Troca de óleo, relação, pneus e freios: saiba os prazos certos por quilometragem e quanto custa adiar cada um deles.",
    data: "2026-09-26",
    tempoLeitura: "6 min",
    conteudo: [
      "Para o entregador, a moto parada é dia sem faturamento. E a maioria das quebras caras começa como uma manutenção barata que foi adiada.",
      "## Os 4 itens que não podem passar do prazo",
      "Óleo do motor: troque a cada 1.000 a 2.000 km (motos de baixa cilindrada que rodam o dia todo pedem o intervalo menor). Rodar com óleo vencido desgasta o motor e uma retífica custa dezenas de trocas de óleo.",
      "Kit relação (corrente, coroa e pinhão): dura em média 10.000 a 15.000 km com lubrificação em dia. Corrente esticada demais pode estourar e danificar o cárter.",
      "Pneus: além do desgaste (TW I), verifique a calibragem toda semana. Pneu murcho aumenta o consumo de combustível em até 10% e desgasta ombros do pneu.",
      "Freios: pastilha e fluido. Pastilha gasta demais risca o disco — e disco de freio custa muito mais que pastilha.",
      "## Como não esquecer nada",
      "A forma mais confiável é controlar por quilometragem, não por data. No Rota Control, cada abastecimento atualiza o hodômetro e o app avisa quando a troca de óleo ou a revisão está chegando — antes de virar problema.",
      "## Reserve um fundo de manutenção",
      "Separe de R$ 0,05 a R$ 0,08 por km rodado em uma reserva só para a moto. Quando a relação ou o pneu chegarem no fim da vida, o dinheiro já está lá — sem apertar o orçamento do mês.",
    ],
  },
];
