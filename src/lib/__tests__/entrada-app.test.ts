import { describe, expect, it } from "vitest";
import { destinoEntradaApp } from "../entrada-app";

describe("entrada do No Corre com sessão", () => {
  it("abre Início na raiz com conta conectada, sem depender do Capacitor", () => {
    expect(destinoEntradaApp("/", { nome: "Thiago" })).toBe("/inicio");
  });
  it("abre Início pelo endereço antigo /nocorre com conta conectada", () => {
    expect(destinoEntradaApp("/nocorre", { nome: "Thiago" })).toBe("/inicio");
  });
  it("mantém a apresentação pública para visitantes sem sessão", () => {
    expect(destinoEntradaApp("/", null)).toBeNull();
  });
  it("encaminha conta sem nome para completar o perfil", () => {
    expect(destinoEntradaApp("/", { nome: "" })).toBe("/perfil");
  });
  it("não interfere no portal ou em outras páginas públicas", () => {
    for (const pathname of ["/portal", "/privacidade", "/redefinir-senha"]) {
      expect(destinoEntradaApp(pathname, { nome: "Thiago" })).toBeNull();
    }
  });
  it("mantém o encaminhamento após login", () => {
    expect(destinoEntradaApp("/auth", { nome: "Thiago" })).toBe("/inicio");
  });
});