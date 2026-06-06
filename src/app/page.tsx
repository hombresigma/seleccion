import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import type { Concurso, Profile } from "@/lib/types";
import { crearConcurso } from "./actions";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single<Profile>();

  const { data: concursos } = await supabase
    .from("concursos")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Concurso[]>();

  const esAdmin = profile?.rol === "admin";

  return (
    <>
      <Header profile={profile} />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Concursos docentes</h1>

        {esAdmin && (
          <form
            action={crearConcurso}
            className="mt-6 rounded-xl border border-slate-200 bg-white p-5"
          >
            <h2 className="text-sm font-semibold text-slate-700">
              Nuevo concurso
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input
                name="nombre"
                required
                placeholder="Nombre del concurso"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                name="descripcion"
                placeholder="Descripción (opcional)"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <button className="mt-3 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
              Crear concurso
            </button>
          </form>
        )}

        <ul className="mt-6 space-y-3">
          {(concursos ?? []).map((c) => (
            <li key={c.id}>
              <Link
                href={`/concursos/${c.id}`}
                className="block rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-400"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{c.nombre}</span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs uppercase text-slate-600">
                    {c.estado}
                  </span>
                </div>
                {c.descripcion && (
                  <p className="mt-1 text-sm text-slate-500">{c.descripcion}</p>
                )}
              </Link>
            </li>
          ))}
          {(concursos ?? []).length === 0 && (
            <p className="text-sm text-slate-500">
              No hay concursos todavía.
              {esAdmin
                ? " Creá el primero arriba."
                : " Esperá a que un administrador cree uno."}
            </p>
          )}
        </ul>
      </main>
    </>
  );
}
