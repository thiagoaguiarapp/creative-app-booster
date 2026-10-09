import { describe, expect, it } from "vitest";

import { filtrarEntregas, intervaloPersonalizado } from "@/lib/entregas-filtro";

const linhas = [
  { row: "r1", iso: "2026-09-30", plataforma: "iFood" },
  { row: "r2", iso: "2026-10-05", plataforma: "iFood" },
  { row: "r3", iso: "2026-10-10", plataforma: "99" },
  { row: "r4", iso: "2026-10-11", plataforma: "99" },
];

describe("filtro personalizado de entregas", () => {
  it("mantém só as entregas do intervalo, incluindo os dois dias extremos", () => {
    const r = filtrarEntregas(linhas, {
      periodo: "personalizado",
      app: "todos",
      de: "2026-10-05",
      ate: "2026-10-10",
    });
    expect(r.map((x) => x.row)).toEqual(["r3", "r2"]);
  });

  it("aceita o intervalo digitado com as datas invertidas", () => {
    const r = filtrarEntregas(linhas, {
      periodo: "personalizado",
      app: "todos",
      de: "2026-10-10",
      ate: "2026-10-05",
    });
    expect(r.map((x) => x.row)).toEqual(["r3", "r2"]);
  });

  it("um único dia busca apenas aquele dia", () => {
    const r = filtrarEntregas(linhas, {
      periodo: "personalizado",
      app: "todos",
      de: "2026-10-05",
      ate: "2026-10-05",
    });
    expect(r.map((x) => x.row)).toEqual(["r2"]);
  });

  it("combina o intervalo com o filtro por aplicativo", () => {
    const r = filtrarEntregas(linhas, {
      periodo: "personalizado",
      app: "99",
      de: "2026-10-10",
      ate: "2026-10-11",
    });
    expect(r.map((x) => x.row)).toEqual(["r4", "r3"]);
  });
});

describe("intervaloPersonalizado", () => {
  it("ordena as datas e trata data única quando um lado fica vazio", () => {
    expect(intervaloPersonalizado("2026-10-10", "2026-10-05")).toEqual({
      de: "2026-10-05",
      ate: "2026-10-10",
    });
    expect(intervaloPersonalizado("2026-10-05", "")).toEqual({ de: "2026-10-05", ate: "2026-10-05" });
    expect(intervaloPersonalizado("", "")).toEqual({ de: "", ate: "" });
  });
});
