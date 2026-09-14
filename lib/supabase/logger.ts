export type SupabaseLogEntry = {
  timestamp: string;
  type: "query" | "auth" | "realtime" | "error";
  table?: string;
  operation?: string;
  duration?: number;
  error?: string;
  result?: unknown;
};

export function logSupabase(entry: Omit<SupabaseLogEntry, "timestamp">) {
  const logEntry: SupabaseLogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };

  if (process.env.NODE_ENV === "development") {
    const prefix = `[Supabase:${entry.type}]`;
    const table = entry.table ? ` ${entry.table}` : "";
    const op = entry.operation ? `.${entry.operation}()` : "";
    const duration = entry.duration ? ` (${entry.duration}ms)` : "";
    const error = entry.error ? ` ERROR: ${entry.error}` : "";
    console.log(`${prefix}${table}${op}${duration}${error}`, logEntry);
  }
}
