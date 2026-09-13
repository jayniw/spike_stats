"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Building2, Mail } from "lucide-react";

export default function NoOrganizationPage() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 size-12 rounded-full bg-muted flex items-center justify-center">
            <Building2 className="size-6 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">Sin organización</CardTitle>
          <CardDescription>
            Tu cuenta no está asociada a ninguna organización. Para usar Spike
            Stats necesitas ser parte de una organización.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <Users className="size-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground">Unirte a una organización</p>
                <p>
                  Solicita a un administrador que te agregue a su organización
                  como miembro.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Building2 className="size-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground">Crear tu organización</p>
                <p>
                  Si eres entrenador o responsable, crea una nueva organización
                  y gestiona tu equipo.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="size-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground">Contactar soporte</p>
                <p>
                  Si crees que esto es un error, contacta al administrador del
                  sistema.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t space-y-2">
            <p className="text-xs text-center text-muted-foreground">
              Conectado como: {user?.email}
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => signOut()}
            >
              Cerrar sesión
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
