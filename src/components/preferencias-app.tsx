import { Check, Eye, Globe, Moon, Palette, Smartphone, Sun, Type } from "lucide-react";
import { useEffect, useState } from "react";

import { SectionCard } from "@/components/shell";
import { Switch } from "@/components/ui/switch";
import {
  lerPreferencias,
  PREFERENCIAS_PADRAO,
  salvarPreferencias,
  type CorDestaque,
  type Fonte,
  type Preferencias,
  type Tema,
} from "@/lib/preferencias";
import { cn } from "@/lib/utils";

const CORES: { id: CorDestaque; nome: string; amostra: string }[] = [
  { id: "ciano", nome: "Ciano", amostra: "oklch(0.78 0.13 226)" },
  { id: "laranja", nome: "Laranja", amostra: "oklch(0.74 0.17 52)" },
  { id: "verde", nome: "Verde", amostra: "oklch(0.76 0.16 150)" },
  { id: "azul", nome: "Azul", amostra: "oklch(0.66 0.17 262)" },
  { id: "roxo", nome: "Roxo", amostra: "oklch(0.7 0.2 305)" },
];
const TEMAS: { id: Tema; nome: string; icone: typeof Sun }[] = [
  { id: "escuro", nome: "Escuro", icone: Moon },
  { id: "claro", nome: "Claro", icone: Sun },
];
const FONTES: { id: Fonte; nome: string; classe: string }[] = [
  { id: "normal", nome: "Normal", classe: "text-sm" },
  { id: "grande", nome: "Grande", classe: "text-base" },
  { id: "extra", nome: "Extra", classe: "text-lg" },
];
const IDIOMAS = [
  { id: "pt", nome: "Português (Brasil)", pronto: true },
  { id: "es", nome: "Español", pronto: false },
  { id: "en", nome: "English", pronto: false },
];

function Opcao({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
        ativo ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Titulo({ icone: Icone, children }: { icone: typeof Sun; children: React.ReactNode }) {
  return (
    <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
      <Icone className="size-4 text-primary" />
      {children}
    </p>
  );
}

export function PreferenciasApp() {
  const [p, setP] = useState<Preferencias>(PREFERENCIAS_PADRAO);
  useEffect(() => setP(lerPreferencias()), []);

  const mudar = (m: Partial<Preferencias>) => {
    const nova = { ...p, ...m };
    setP(nova);
    salvarPreferencias(nova);
  };

  return (
    <SectionCard title="Preferências do aplicativo" description="Cores, tema, letra, idioma e privacidade — vale neste aparelho">
      <div className="flex flex-col gap-6">
        <div>
          <Titulo icone={Palette}>Cor do app</Titulo>
          <div className="grid grid-cols-5 gap-2">
            {CORES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => mudar({ cor: c.id })}
                aria-pressed={p.cor === c.id}
                className="flex flex-col items-center gap-1.5 text-xs text-muted-foreground"
              >
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full ring-offset-2 ring-offset-background",
                    p.cor === c.id && "ring-2 ring-foreground",
                  )}
                  style={{ background: c.amostra }}
                >
                  {p.cor === c.id && <Check className="size-5 text-background" />}
                </span>
                {c.nome}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Titulo icone={Moon}>Tema</Titulo>
          <div className="flex gap-2">
            {TEMAS.map((t) => (
              <Opcao key={t.id} ativo={p.tema === t.id} onClick={() => mudar({ tema: t.id })}>
                <t.icone className="size-4" /> {t.nome}
              </Opcao>
            ))}
          </div>
        </div>

        <div>
          <Titulo icone={Type}>Tamanho da letra</Titulo>
          <div className="flex gap-2">
            {FONTES.map((f) => (
              <Opcao key={f.id} ativo={p.fonte === f.id} onClick={() => mudar({ fonte: f.id })}>
                <span className={f.classe}>Aa</span> {f.nome}
              </Opcao>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">Letra maior ajuda a ler o celular no suporte da moto.</p>
        </div>

        <div>
          <Titulo icone={Globe}>Idioma</Titulo>
          <div className="flex flex-col gap-2">
            {IDIOMAS.map((i) => (
              <div
                key={i.id}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm",
                  i.pronto ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground opacity-70",
                )}
              >
                <span>{i.nome}</span>
                {i.pronto ? <Check className="size-4" /> : <span className="text-xs">Em breve</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-border/60 pt-4">
          <label className="flex items-center justify-between gap-3">
            <span className="flex items-start gap-2">
              <Eye className="mt-0.5 size-4 text-primary" />
              <span>
                <span className="block text-sm font-semibold">Esconder valores</span>
                <span className="block text-xs text-muted-foreground">Embaça os valores em R$. Segure em cima para ver.</span>
              </span>
            </span>
            <Switch checked={p.privacidade} onCheckedChange={(v) => mudar({ privacidade: v })} />
          </label>
          <label className="flex items-center justify-between gap-3">
            <span className="flex items-start gap-2">
              <Smartphone className="mt-0.5 size-4 text-primary" />
              <span>
                <span className="block text-sm font-semibold">Vibrar ao salvar</span>
                <span className="block text-xs text-muted-foreground">Confirma o lançamento sem precisar olhar a tela.</span>
              </span>
            </span>
            <Switch checked={p.vibracao} onCheckedChange={(v) => mudar({ vibracao: v })} />
          </label>
        </div>
      </div>
    </SectionCard>
  );
}
