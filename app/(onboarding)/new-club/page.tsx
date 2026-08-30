"use client";

import * as React from "react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClubAction } from "./actions";

export default function NewClubPage() {
  const [state, formAction, pending] = useActionState(createClubAction, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Crear tu club</CardTitle>
        <CardDescription>
          Registra tu club para empezar a gestionar equipos y partidos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6" noValidate>
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del club</Label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              maxLength={80}
              placeholder="Ej. Club Voleibol Delta"
              className="min-h-12"
              autoFocus
            />
          </div>

          {state.error ? (
            <p
              role="alert"
              className="rounded-md border border-destructive/60 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {state.error}
            </p>
          ) : null}

          <Button type="submit" disabled={pending} className="w-full min-h-12">
            {pending ? "Creando…" : "Crear club"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
