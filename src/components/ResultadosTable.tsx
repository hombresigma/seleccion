import type { Resultados } from "@/lib/types";

export default function ResultadosTable({ data }: { data: Resultados }) {
  const { criterios, participantes, suma_pesos, ganador } = data;

  if (criterios.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Definí los criterios para ver el cuadro de resultados.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {Math.abs(Number(suma_pesos) - 100) > 0.001 && (
        <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          ⚠️ Los pesos suman <strong>{Number(suma_pesos).toFixed(2)}%</strong>, no
          100%. Ajustá los criterios para una ponderación válida.
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left">
              <th className="px-3 py-2 font-semibold">Participante</th>
              {criterios.map((c) => (
                <th key={c.id} className="px-3 py-2 text-right font-semibold">
                  {c.nombre}
                  <span className="block text-xs font-normal text-slate-400">
                    peso {Number(c.peso).toFixed(0)}%
                  </span>
                </th>
              ))}
              <th className="px-3 py-2 text-right font-semibold">Acumulado</th>
            </tr>
          </thead>
          <tbody>
            {participantes.map((p) => {
              const esGanador = ganador?.id === p.id;
              return (
                <tr
                  key={p.id}
                  className={`border-b border-slate-100 ${
                    esGanador ? "bg-emerald-50" : ""
                  }`}
                >
                  <td className="px-3 py-2 font-medium">
                    {p.nombre}
                    {esGanador && (
                      <span className="ml-2 rounded bg-emerald-600 px-1.5 py-0.5 text-xs text-white">
                        ★ mayor
                      </span>
                    )}
                  </td>
                  {criterios.map((c) => {
                    const det = p.criterios.find(
                      (x) => x.criterio_id === c.id
                    );
                    return (
                      <td key={c.id} className="px-3 py-2 text-right">
                        <span className="font-medium">
                          {det ? det.aporte.toFixed(2) : "0.00"}
                        </span>
                        <span className="block text-xs text-slate-400">
                          prom {det ? det.promedio.toFixed(1) : "0"}
                          {det && det.n_evaluadores > 0
                            ? ` · ${det.n_evaluadores}j`
                            : ""}
                        </span>
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-right text-base font-bold">
                    {p.acumulado.toFixed(2)}
                  </td>
                </tr>
              );
            })}
            {participantes.length === 0 && (
              <tr>
                <td
                  colSpan={criterios.length + 2}
                  className="px-3 py-4 text-center text-slate-500"
                >
                  No hay participantes cargados.
                </td>
              </tr>
            )}
          </tbody>
          {participantes.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-slate-300 bg-slate-50">
                <td className="px-3 py-3 font-semibold">
                  Resultado del concurso
                </td>
                <td
                  colSpan={criterios.length}
                  className="px-3 py-3 text-right text-slate-500"
                >
                  {ganador ? (
                    <>Docente con mayor calificación:</>
                  ) : (
                    <>Sin calificaciones cargadas aún</>
                  )}
                </td>
                <td className="px-3 py-3 text-right">
                  {ganador ? (
                    <span className="font-bold text-emerald-700">
                      {ganador.nombre} — {Number(ganador.acumulado).toFixed(2)}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <p className="text-xs text-slate-400">
        Aporte de cada criterio = promedio del jurado × (peso ÷ 100). El
        acumulado es la suma de los aportes. &quot;j&quot; = cantidad de jurados que
        calificaron.
      </p>
    </div>
  );
}
