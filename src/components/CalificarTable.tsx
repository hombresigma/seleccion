"use client";

import { useState, useTransition } from "react";
import type { Criterio, Participante } from "@/lib/types";
import { guardarCalificacion } from "@/app/concursos/[id]/actions";

type MisCalif = Record<string, number>; // clave: `${participanteId}:${criterioId}`

function clave(p: string, c: string) {
  return `${p}:${c}`;
}

export default function CalificarTable({
  concursoId,
  criterios,
  participantes,
  iniciales,
}: {
  concursoId: string;
  criterios: Criterio[];
  participantes: Participante[];
  iniciales: MisCalif;
}) {
  const [valores, setValores] = useState<MisCalif>(iniciales);
  const [guardando, setGuardando] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (criterios.length === 0 || participantes.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Se necesitan criterios y participantes cargados para poder calificar.
      </p>
    );
  }

  function onGuardar(participanteId: string, criterioId: string, raw: string) {
    const num = Math.max(0, Math.min(100, Number(raw)));
    if (isNaN(num)) return;
    const k = clave(participanteId, criterioId);
    setValores((v) => ({ ...v, [k]: num }));
    setGuardando(k);
    startTransition(async () => {
      await guardarCalificacion(participanteId, criterioId, num, concursoId);
      setGuardando(null);
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold">Mis calificaciones</h2>
      <p className="mt-1 text-sm text-slate-500">
        Puntuá de 0 a 100 a cada participante en cada criterio. Se guarda al salir
        del casillero. El sistema promedia tu puntaje con el del resto del jurado.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left">
              <th className="px-3 py-2 font-semibold">Participante</th>
              {criterios.map((c) => (
                <th key={c.id} className="px-3 py-2 text-right font-semibold">
                  {c.nombre}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {participantes.map((p) => (
              <tr key={p.id} className="border-b border-slate-100">
                <td className="px-3 py-2 font-medium">{p.nombre}</td>
                {criterios.map((c) => {
                  const k = clave(p.id, c.id);
                  return (
                    <td key={c.id} className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="0.01"
                          defaultValue={valores[k] ?? ""}
                          onBlur={(e) => onGuardar(p.id, c.id, e.target.value)}
                          className="w-20 rounded-md border border-slate-300 px-2 py-1 text-right"
                        />
                        {guardando === k && (
                          <span className="text-xs text-slate-400">…</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
