import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  showBanner: vi.fn().mockResolvedValue(undefined),
  initialize: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => true, getPlatform: () => "android" },
}));
vi.mock("@capacitor-community/admob", () => ({
  AdMob: mocks,
  BannerAdPosition: { BOTTOM_CENTER: "BOTTOM_CENTER" },
  BannerAdSize: { ADAPTIVE_BANNER: "ADAPTIVE_BANNER" },
}));

import { ADMOB_BANNER_INICIO_ID_ANDROID, mostrarBanner } from "../admob";

describe("banner Android por tela", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {});
    mocks.showBanner.mockClear();
  });

  it("envia o bloco informado para o Início", async () => {
    expect(await mostrarBanner(ADMOB_BANNER_INICIO_ID_ANDROID)).toBe(true);
    expect(mocks.showBanner).toHaveBeenCalledWith(expect.objectContaining({
      adId: "ca-app-pub-2715745778380480/4345848739",
      isTesting: false,
    }));
  });

  it("preserva o banner das demais telas", async () => {
    await mostrarBanner();
    expect(mocks.showBanner).toHaveBeenCalledWith(expect.objectContaining({
      adId: "ca-app-pub-2715745778380480/4859804306",
    }));
  });
});