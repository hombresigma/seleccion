import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import CriteriosManager from "@/components/CriteriosManager";
import ParticipantesManager from "@/components/ParticipantesManager";
import CalificarTable from "@/components/CalificarTable";
import ResultadosTable from "@/components/ResultadosTable";
import type {
  Concurso,
  Criterio,
  Participante,
  Profile,
  Resultados,
} from "@/lib/types";

export default async function ConcursoPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single<Profile>();

  const { data: concurso } = await supabase
    .from("concursos")
    .select("*")
    .eq("id", id)
    .single<Concurso>();

  if (!concurso) notFound();

  const [{ data: criterios }, { data: participantes }, { data: misCalif }, { data: resultados }] =
    await Promise.all([
      supabase
        .from("criterios")
        .select("*")
        .eq("concurso_id", id)
        .order("orden")
        .returns<Criterio[]>(),
      supabase
        .from("participantes")
        .select("*")
        .eq("concurso_id", id)
        .order("nombre")
        .returns<Participante[]>(),
      supabase
        .from("calificaciones")
        .select("participante_id, criterio_id, puntaje")
        .eq("evaluador_id", user!.id),
      supabase.rpc("resultados_concurso", { p_concurso_id: id }),
    ]);

  const esAdmin = profile?.rol === "admin";

  const iniciales: Record<string, number> = {};
  for (const c of misCalif ?? []) {
    iniciales[`${c.participante_id}:${c.criterio_id}`] = Number(c.puntaje);
  }

  return (
    <>
      <Header profile={profile} />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <div>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">
            ← Volver
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">{concurso.nombre}</h1>
          {concurso.descripcion && (
            <p className="text-slate-500">{concurso.descripcion}</p>
          )}
        </div>

        {/* Cuadro de resultados ponderado */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">Cuadro de resultados</h2>
          <ResultadosTable data={resultados as Resultados} />
        </section>

        {/* Carga de calificaciones del jurado actual */}
        <section>
          <CalificarTable
            concursoId={id}
            criterios={criterios ?? []}
            participantes={participantes ?? []}
            iniciales={iniciales}
          />
        </section>

        {/* Administración (solo admin) */}
        {esAdmin && (
          <>
            <CriteriosManager concursoId={id} criterios={criterios ?? []} />
            <ParticipantesManager
              concursoId={id}
              participantes={participantes ?? []}
            />
          </>
        )}
      </main>
    </>
  );
}
