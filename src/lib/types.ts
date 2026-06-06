export type Rol = "admin" | "jurado";

export type Profile = {
  id: string;
  email: string | null;
  nombre: string | null;
  rol: Rol;
};

export type Concurso = {
  id: string;
  nombre: string;
  descripcion: string | null;
  estado: "abierto" | "cerrado";
  created_at: string;
};

export type Criterio = {
  id: string;
  concurso_id: string;
  nombre: string;
  peso: number;
  orden: number;
};

export type Participante = {
  id: string;
  concurso_id: string;
  nombre: string;
  documento: string | null;
};

export type Calificacion = {
  id: string;
  participante_id: string;
  criterio_id: string;
  evaluador_id: string;
  puntaje: number;
};

// Estructura que devuelve la función resultados_concurso()
export type ResultadoCriterio = {
  criterio_id: string;
  nombre: string;
  peso: number;
  promedio: number;
  aporte: number;
  n_evaluadores: number;
};

export type ResultadoParticipante = {
  id: string;
  nombre: string;
  documento: string | null;
  criterios: ResultadoCriterio[];
  acumulado: number;
};

export type Resultados = {
  criterios: { id: string; nombre: string; peso: number }[];
  suma_pesos: number;
  participantes: ResultadoParticipante[];
  ganador: { id: string; nombre: string; acumulado: number } | null;
};
