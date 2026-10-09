import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (valor: string) => void;
  autoComplete?: string;
  placeholder?: string;
};

export function CampoSenha({ id, label, value, onChange, autoComplete, placeholder }: Props) {
  const [mostrando, setMostrando] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={mostrando ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setMostrando((v) => !v)}
          aria-label={mostrando ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={mostrando}
          tabIndex={-1}
          className="absolute top-0 right-0 flex h-full w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none"
        >
          {mostrando ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  );
}
