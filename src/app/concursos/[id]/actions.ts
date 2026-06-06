"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function revalidar(concursoId: string) {
  revalidatePath(`/concursos/${concursoId}`);
}

export async function agregarCriterio(formData: FormData) {
  const concursoId = String(formData.get("concurso_id"));
  const nombre = String(formData.get("nombre") || "").trim();
  const peso = Number(formData.get("peso"));
  const orden = Number(formData.get("orden") || 0);
  if (!nombre || isNaN(peso)) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("criterios")
    .insert({ concurso_id: concursoId, nombre, peso, orden });
  if (error) throw new Error(error.message);
  revalidar(concursoId);
}

export async function actualizarCriterio(formData: FormData) {
  const id = String(formData.get("id"));
  const concursoId = String(formData.get("concurso_id"));
  const nombre = String(formData.get("nombre") || "").trim();
  const peso = Number(formData.get("peso"));

  const supabase = await createClient();
  const { error } = await supabase
    .from("criterios")
    .update({ nombre, peso })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidar(concursoId);
}

export async function eliminarCriterio(formData: FormData) {
  const id = String(formData.get("id"));
  const concursoId = String(formData.get("concurso_id"));

  const supabase = await createClient();
  const { error } = await supabase.from("criterios").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidar(concursoId);
}

export async function agregarParticipante(formData: FormData) {
  const concursoId = String(formData.get("concurso_id"));
  const nombre = String(formData.get("nombre") || "").trim();
  const documento = String(formData.get("documento") || "").trim();
  if (!nombre) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("participantes")
    .insert({ concurso_id: concursoId, nombre, documento: documento || null });
  if (error) throw new Error(error.message);
  revalidar(concursoId);
}

export async function eliminarParticipante(formData: FormData) {
  const id = String(formData.get("id"));
  const concursoId = String(formData.get("concurso_id"));

  const supabase = await createClient();
  const { error } = await supabase.from("participantes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidar(concursoId);
}

// Guarda (o actualiza) la calificación del jurado actual.
export async function guardarCalificacion(
  participanteId: string,
  criterioId: string,
  puntaje: number,
  concursoId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { error } = await supabase.from("calificaciones").upsert(
    {
      participante_id: participanteId,
      criterio_id: criterioId,
      evaluador_id: user.id,
      puntaje,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "participante_id,criterio_id,evaluador_id" }
  );
  if (error) throw new Error(error.message);
  revalidar(concursoId);
}
