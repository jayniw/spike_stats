import { loadEnvFile } from "../scripts/lib/load-env";

// Vitest no carga .env.local; este setup global corre una vez antes de todos
// los proyectos (unit, contract, integration) y puebla process.env.
export default function setup(): void {
  loadEnvFile([".env.local", ".env"]);
}
