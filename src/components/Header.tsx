import Link from "next/link";
import type { Profile } from "@/lib/types";

export default function Header({ profile }: { profile: Profile | null }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold">
          Selección de Docentes
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {profile && (
            <span className="text-slate-500">
              {profile.nombre || profile.email}{" "}
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium uppercase">
                {profile.rol}
              </span>
            </span>
          )}
          <form action="/auth/signout" method="post">
            <button className="text-slate-500 hover:text-slate-900">Salir</button>
          </form>
        </div>
      </div>
    </header>
  );
}
