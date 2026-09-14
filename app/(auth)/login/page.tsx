import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Spike Stats</h1>
        <p className="text-muted-foreground">Inicia sesión para continuar</p>
      </div>

      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
