"use client";

import type { Criterio } from "@/lib/types";
import {
  agregarCriterio,
  actualizarCriterio,
  eliminarCriterio,
} from "@/app/concursos/[id]/actions";

export default function CriteriosManager({
  concursoId,
  criterios,
}: {
  concursoId: string;
  criterios: Criterio[];
}) {
  const suma = criterios.reduce((acc, c) => acc + Number(c.peso), 0);
  const ok = Math.abs(suma - 100) < 0.001;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Criterios y pesos</h2>
        <span
          className={`rounded px-2 py-0.5 text-xs font-medium ${
            ok ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
          }`}
        >
          Total: {suma.toFixed(2)}% {ok ? "✓" : "(debe ser 100%)"}
        </span>
      </div>

      <ul className="mt-4 space-y-2">
        {criterios.map((c, i) => (
          <li key={c.id} className="flex items-center gap-2">
            <form
              action={actualizarCriterio}
              className="flex flex-1 items-center gap-2"
            >
              <input type="hidden" name="id" value={c.id} />
              <input type="hidden" name="concurso_id" value={concursoId} />
              <span className="w-5 text-xs text-slate-400">{i + 1}.</span>
              <input
                name="nombre"
                defaultValue={c.nombre}
                className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              />
              <div className="flex items-center gap-1">
                <input
                  name="peso"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  defaultValue={Number(c.peso)}
                  className="w-20 rounded-md border border-slate-300 px-2 py-1.5 text-right text-sm"
                />
                <span className="text-sm text-slate-400">%</span>
              </div>
              <button className="rounded-md border border-slate-300 px-2 py-1.5 text-xs hover:bg-slate-50">
                Guardar
              </button>
            </form>
            <form action={eliminarCriterio}>
              <input type="hidden" name="id" value={c.id} />
              <input type="hidden" name="concurso_id" value={concursoId} />
              <button className="rounded-md px-2 py-1.5 text-xs text-red-600 hover:bg-red-50">
                Eliminar
              </button>
            </form>
          </li>
        ))}
        {criterios.length === 0 && (
          <p className="text-sm text-slate-500">Sin criterios todavía.</p>
        )}
      </ul>

      <form
        action={agregarCriterio}
        className="mt-4 flex items-end gap-2 border-t border-slate-100 pt-4"
      >
        <input type="hidden" name="concurso_id" value={concursoId} />
        <input type="hidden" name="orden" value={criterios.length} />
        <div className="flex-1">
          <label className="block text-xs text-slate-500">Nuevo criterio</label>
          <input
            name="nombre"
            required
            placeholder="Ej: Antecedentes académicos"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500">Peso %</label>
          <input
            name="peso"
            type="number"
            step="0.01"
            min="0"
            max="100"
            required
            placeholder="25"
            className="mt-1 w-20 rounded-md border border-slate-300 px-2 py-1.5 text-right text-sm"
          />
        </div>
        <button className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700">
          Agregar
        </button>
      </form>
    </div>
  );
}
