"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function crearConcurso(formData: FormData) {
  const nombre = String(formData.get("nombre") || "").trim();
  const descripcion = String(formData.get("descripcion") || "").trim();
  if (!nombre) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("concursos")
    .insert({ nombre, descripcion: descripcion || null, created_by: user?.id })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  redirect(`/concursos/${data.id}`);
}
