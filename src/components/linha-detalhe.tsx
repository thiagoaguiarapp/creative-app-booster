import { ChevronDown } from "lucide-react";
import { Fragment, type ReactNode } from "react";

import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

/** Item de detalhe exibido no submenu da linha */
export function Detalhe({ rotulo, valor }: { rotulo: string; valor: ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{rotulo}</p>
      <p className="num break-words">{valor || "—"}</p>
    </div>
  );
}

/**
 * Linha de tabela que abre um submenu com os detalhes do lançamento.
 * Padrão usado em todas as telas de lançamento.
 */
export function LinhaDetalhavel({
  aberto,
  onToggle,
  colunas,
  celulas,
  detalhes,
  acoes,
}: {
  aberto: boolean;
  onToggle: () => void;
  /** total de colunas da tabela (incluindo a coluna da seta) */
  colunas: number;
  celulas: ReactNode;
  detalhes: ReactNode;
  acoes?: ReactNode;
}) {
  return (
    <Fragment>
      <TableRow className="cursor-pointer" onClick={onToggle}>
        {celulas}
        <TableCell className="w-8 text-right">
          <ChevronDown
            aria-hidden
            className={cn(
              "size-4 text-muted-foreground transition-transform",
              aberto && "rotate-180",
            )}
          />
        </TableCell>
      </TableRow>
      {aberto && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={colunas} className="bg-muted/30">
            <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3 sm:text-sm">
              {detalhes}
            </div>
            {acoes && <div className="mt-3 flex justify-end">{acoes}</div>}
          </TableCell>
        </TableRow>
      )}
    </Fragment>
  );
}
