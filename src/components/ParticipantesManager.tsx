"use client";

import type { Participante } from "@/lib/types";
import {
  agregarParticipante,
  eliminarParticipante,
} from "@/app/concursos/[id]/actions";

export default function ParticipantesManager({
  concursoId,
  participantes,
}: {
  concursoId: string;
  participantes: Participante[];
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold">Participantes</h2>

      <ul className="mt-4 space-y-2">
        {participantes.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2"
          >
            <span className="text-sm">
              <span className="font-medium">{p.nombre}</span>
              {p.documento && (
                <span className="ml-2 text-slate-400">{p.documento}</span>
              )}
            </span>
            <form action={eliminarParticipante}>
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="concurso_id" value={concursoId} />
              <button className="text-xs text-red-600 hover:underline">
                Eliminar
              </button>
            </form>
          </li>
        ))}
        {participantes.length === 0 && (
          <p className="text-sm text-slate-500">Sin participantes todavía.</p>
        )}
      </ul>

      <form
        action={agregarParticipante}
        className="mt-4 flex items-end gap-2 border-t border-slate-100 pt-4"
      >
        <input type="hidden" name="concurso_id" value={concursoId} />
        <div className="flex-1">
          <label className="block text-xs text-slate-500">Nombre</label>
          <input
            name="nombre"
            required
            placeholder="Apellido y nombre"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500">Documento</label>
          <input
            name="documento"
            placeholder="DNI (opcional)"
            className="mt-1 w-32 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          />
        </div>
        <button className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700">
          Agregar
        </button>
      </form>
    </div>
  );
}
