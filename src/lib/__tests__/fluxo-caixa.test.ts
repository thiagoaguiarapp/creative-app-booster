import { expect, test } from "vitest";
import { montaFluxo, faltaReceber } from "@/lib/fluxo-caixa";

const data: any = {
  ganhos: [
    { id:"1",row:"1",data:"05/07/2026",iso:"2026-07-05",plataforma:"iFood",corridas:10,faturamento:1000,recebido:0 },
    { id:"2",row:"2",data:"05/07/2026",iso:"2026-07-05",plataforma:"Gorjeta",corridas:0,faturamento:50,recebido:50 },
    { id:"3",row:"3",data:"03/09/2026",iso:"2026-09-03",plataforma:"Uber",corridas:5,faturamento:400,recebido:0 },
  ],
  repasses: [
    { id:"r1",row:"r1",data:"10/07/2026",iso:"2026-07-10",aplicativo:"iFood",valor:600,forma:"Pix" },
    { id:"r2",row:"r2",data:"02/09/2026",iso:"2026-09-02",aplicativo:"iFood",valor:400,forma:"Pix" },
  ],
  despesas: [
    { id:"d1",row:"d1",data:"06/07/2026",iso:"2026-07-06",valor:200,categoria:"Outros",descricao:"",pagamento:"Pix" },
    { id:"d2",row:"d2",data:"10/09/2026",iso:"2026-09-10",valor:300,categoria:"Outros",descricao:"peça (1/2) [compra 06/07/2026]",pagamento:"Crédito" },
  ],
  abastecimentos: [], manutencoes: [], odometroAtual: 0,
};

test("sem duplicar entradas e sem faltar meses", () => {
  const f = montaFluxo(data);
  expect(f.map(m=>m.mes)).toEqual(["2026-09","2026-08","2026-07"]);
  const jul = f.find(m=>m.mes==="2026-07")!;
  expect(jul.entradas).toBe(650); // 600 repasse + 50 gorjeta (não 1000+600)
  expect(jul.saidas).toBe(200);
  expect(jul.saldo).toBe(450);
  const set = f.find(m=>m.mes==="2026-09")!;
  expect(set.entradas).toBe(400);
  expect(set.saidas).toBe(300);
  expect(set.credito).toBe(300);
  expect(faltaReceber(data)).toBe(400); // 1400 faturado - 1000 recebido
});
