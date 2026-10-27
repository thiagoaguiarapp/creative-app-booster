import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  showBanner: vi.fn().mockResolvedValue(undefined),
  initialize: vi.fn().mockResolvedValue(undefined),
  removeBanner: vi.fn().mockResolvedValue(undefined),
}));


vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => true, getPlatform: () => "android" },
}));
vi.mock("@capacitor-community/admob", () => ({
  AdMob: mocks,
  BannerAdPosition: { BOTTOM_CENTER: "BOTTOM_CENTER" },
  BannerAdSize: { ADAPTIVE_BANNER: "ADAPTIVE_BANNER" },
}));

import {
  ADMOB_BANNER_ID_ANDROID,
  esconderBanner,
  mostrarBanner,
  pausarBanner,
  retomarBanner,
} from "../admob";

const esperaUmPouco = () => new Promise((resolver) => setTimeout(resolver, 20));


const BANNER_RODAPE = "ca-app-pub-2715745778380480/4859804306";

describe("banner Android por tela", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {});
    mocks.showBanner.mockClear();
  });

  it("envia o bloco do rodapé também quando um bloco é informado", async () => {
    expect(await mostrarBanner(ADMOB_BANNER_ID_ANDROID)).toBe(true);
    expect(mocks.showBanner).toHaveBeenCalledWith(expect.objectContaining({
      adId: BANNER_RODAPE,
      isTesting: false,
    }));
  });

  it("usa o mesmo bloco do rodapé nas demais telas", async () => {
    await mostrarBanner();
    expect(mocks.showBanner).toHaveBeenCalledWith(expect.objectContaining({
      adId: BANNER_RODAPE,
    }));
  });
});
import { deveMostrarIntersticial, ADMOB_INTERSTITIAL_ID_ANDROID } from "@/lib/admob";
describe("intersticial", () => {
  it("usa o bloco real", () => {
    expect(ADMOB_INTERSTITIAL_ID_ANDROID).toBe("ca-app-pub-2715745778380480/4347672561");
  });
  it("só após 3 lançamentos e 5 min", () => {
    expect(deveMostrarIntersticial(2, 0, 10 * 60_000)).toBe(false);
    expect(deveMostrarIntersticial(3, 0, 10 * 60_000)).toBe(true);
    expect(deveMostrarIntersticial(3, 8 * 60_000, 10 * 60_000)).toBe(false);
  });
});
