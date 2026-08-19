import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Bike, Plus, Star, Trash2, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AtalhoPaginas } from "@/components/atalho-paginas";
import { PageHeader, SectionCard } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { salvarPerfilFn, salvarVeiculosFn } from "@/lib/auth.functions";
import { salvarMetaSemanalFn } from "@/lib/metas.functions";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Rota Control" },
      {
        name: "description",
        content:
          "Edite seu nome, telefone, meta semanal e cadastre os veículos usados nas entregas.",
      },
      { property: "og:title", content: "Configurações — Rota Control" },
      {
        property: "og:description",
        content: "Ajuste seus dados e cadastre os veículos do Rota Control.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ConfiguracoesPage,
});

type VeiculoForm = {
  id: string;
  nome: string;
  placa: string;
  tipo: string;
  km: string;
  padrao: boolean;
};

const TIPOS_VEICULO = ["Moto", "Carro", "Bicicleta", "Outro"];

function ConfiguracoesPage() {
  const router = useRouter();
  const { usuario } = Route.useRouteContext();
  const salvarPerfil = useServerFn(salvarPerfilFn);
  const salvarMeta = useServerFn(salvarMetaSemanalFn);
  const salvarVeiculos = useServerFn(salvarVeiculosFn);

  const [nome, setNome] = useState(usuario?.nome ?? "");
  const [telefone, setTelefone] = useState(usuario?.telefone ?? "");
  const [meta, setMeta] = useState(String(usuario?.metaSemanal ?? 0));
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);

  const [veiculos, setVeiculos] = useState<VeiculoForm[]>(
    (usuario?.veiculos ?? []).map((v) => ({
      id: v.id,
      nome: v.nome,
      placa: v.placa,
      tipo: v.tipo,
      km: v.km ? String(v.km) : "",
      padrao: v.padrao,
    })),
  );
  const [salvandoVeiculos, setSalvandoVeiculos] = useState(false);

  const atualizar = (id: string, mudanca: Partial<VeiculoForm>) =>
    setVeiculos((lista) => lista.map((v) => (v.id === id ? { ...v, ...mudanca } : v)));

  const adicionar = () =>
    setVeiculos((lista) => [
      ...lista,
      {
        id: `${Date.now()}`,
        nome: "",
        placa: "",
        tipo: "Moto",
        km: "",
        padrao: lista.length === 0,
      },
    ]);

  const definirPadrao = (id: string) =>
    setVeiculos((lista) => lista.map((v) => ({ ...v, padrao: v.id === id })));

  const remover = (id: string) =>
    setVeiculos((lista) => {
      const restante = lista.filter((v) => v.id !== id);
      if (restante.length > 0 && !restante.some((v) => v.padrao)) restante[0]!.padrao = true;
      return restante;
    });

  const enviarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nome.trim().length < 2) {
      toast.error("Informe seu nome.");
      return;
    }
    setSalvandoPerfil(true);
    try {
      await salvarPerfil({ data: { nome, telefone } });
      await salvarMeta({ data: { valor: Number(meta.replace(",", ".")) || 0 } });
      await router.invalidate();
      toast.success("Dados atualizados.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar seus dados.");
    } finally {
      setSalvandoPerfil(false);
    }
  };

  const enviarVeiculos = async () => {
    const limpos = veiculos.filter((v) => v.nome.trim());
    if (limpos.length !== veiculos.length) {
      toast.error("Dê um nome a todos os veículos (ex.: Honda Biz 2020).");
      return;
    }
    setSalvandoVeiculos(true);
    try {
      await salvarVeiculos({
        data: {
          veiculos: limpos.map((v) => ({
            id: v.id,
            nome: v.nome.trim(),
            placa: v.placa.trim(),
            tipo: v.tipo,
            km: Number(v.km.replace(/\D/g, "")) || 0,
            padrao: v.padrao,
          })),
        },
      });
      await router.invalidate();
      toast.success("Veículos salvos. Eles já aparecem nos lançamentos.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar os veículos.");
    } finally {
      setSalvandoVeiculos(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader title="Configurações" subtitle="Seus dados e veículos do app" />
      <AtalhoPaginas />

      <SectionCard title="Meus dados" description="Nome, contato e meta semanal de faturamento">
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={enviarPerfil}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" value={nome} maxLength={80} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="telefone">WhatsApp / Telefone</Label>
            <Input
              id="telefone"
              value={telefone}
              maxLength={20}
              inputMode="tel"
              onChange={(e) => setTelefone(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="meta">Meta semanal de faturamento (R$)</Label>
            <Input
              id="meta"
              value={meta}
              inputMode="decimal"
              onChange={(e) => setMeta(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-muted-foreground">E-mail da conta</Label>
            <Input value={usuario?.email ?? ""} disabled />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={salvandoPerfil}>
              <User className="size-4" />
              {salvandoPerfil ? "Salvando…" : "Salvar dados"}
            </Button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Meus veículos"
        description="O veículo padrão já vem preenchido ao lançar abastecimento e manutenção"
      >
        <div className="flex flex-col gap-4">
          {veiculos.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum veículo cadastrado ainda. Adicione a moto ou carro que você usa nas entregas.
            </p>
          )}

          {veiculos.map((v) => (
            <div key={v.id} className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-4">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor={`nome-${v.id}`}>Nome do veículo</Label>
                <Input
                  id={`nome-${v.id}`}
                  value={v.nome}
                  maxLength={60}
                  placeholder="Honda Biz 2020"
                  onChange={(e) => atualizar(v.id, { nome: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`placa-${v.id}`}>Placa (opcional)</Label>
                <Input
                  id={`placa-${v.id}`}
                  value={v.placa}
                  maxLength={12}
                  placeholder="ABC1D23"
                  onChange={(e) => atualizar(v.id, { placa: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`tipo-${v.id}`}>Tipo</Label>
                <Select value={v.tipo} onValueChange={(t) => atualizar(v.id, { tipo: t })}>
                  <SelectTrigger id={`tipo-${v.id}`}>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_VEICULO.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`km-${v.id}`}>Km atual (opcional)</Label>
                <Input
                  id={`km-${v.id}`}
                  value={v.km}
                  inputMode="numeric"
                  onChange={(e) => atualizar(v.id, { km: e.target.value })}
                />
              </div>
              <div className="flex items-end gap-2 sm:col-span-3">
                <Button
                  type="button"
                  size="sm"
                  variant={v.padrao ? "default" : "outline"}
                  onClick={() => definirPadrao(v.id)}
                >
                  <Star className="size-4" />
                  {v.padrao ? "Veículo padrão" : "Tornar padrão"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => remover(v.id)}
                >
                  <Trash2 className="size-4" /> Remover
                </Button>
              </div>
            </div>
          ))}

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={adicionar}>
              <Plus className="size-4" /> Adicionar veículo
            </Button>
            <Button type="button" disabled={salvandoVeiculos} onClick={enviarVeiculos}>
              <Bike className="size-4" />
              {salvandoVeiculos ? "Salvando…" : "Salvar veículos"}
            </Button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
