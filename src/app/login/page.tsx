"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [modo, setModo] = useState<"ingresar" | "registrar">("ingresar");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setCargando(true);

    try {
      if (modo === "ingresar") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/");
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { nombre } },
        });
        if (error) throw error;
        if (data.session) {
          router.push("/");
          router.refresh();
        } else {
          setInfo(
            "Cuenta creada. Revisá tu correo para confirmar y luego ingresá."
          );
          setModo("ingresar");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold">Selección de Docentes</h1>
        <p className="mt-1 text-sm text-slate-500">
          {modo === "ingresar" ? "Ingresá a tu cuenta" : "Creá tu cuenta de jurado"}
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {modo === "registrar" && (
            <div>
              <label className="block text-sm font-medium">Nombre</label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Contraseña</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-emerald-600">{info}</p>}

          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {cargando
              ? "Procesando…"
              : modo === "ingresar"
              ? "Ingresar"
              : "Registrarme"}
          </button>
        </form>

        <button
          onClick={() => {
            setModo(modo === "ingresar" ? "registrar" : "ingresar");
            setError(null);
            setInfo(null);
          }}
          className="mt-4 w-full text-center text-sm text-slate-500 hover:text-slate-800"
        >
          {modo === "ingresar"
            ? "¿No tenés cuenta? Registrate"
            : "¿Ya tenés cuenta? Ingresá"}
        </button>
      </div>
    </main>
  );
}
