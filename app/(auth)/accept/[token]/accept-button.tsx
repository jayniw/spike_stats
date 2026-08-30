"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { createBrowserClient } from "@/lib/db/client-browser";
import type { Role } from "@/lib/validation/core";

export function AcceptInviteButton({
  token,
  organizationId,
  role,
}: {
  token: string;
  organizationId: string;
  role: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  async function handleAccept() {
    setLoading(true);

    const supabase = createBrowserClient();

    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Redirect to login with invite info
      router.push(`/login?invite=${token}`);
      return;
    }

    // Accept the invite by creating a membership
    const { error } = await supabase.from("memberships" as never).insert({
      organization_id: organizationId,
      user_id: user.id,
      role: role as Role,
      status: "active",
    } as never);

    if (error) {
      setLoading(false);
      toast({
        title: "Error",
        description: `No se pudo aceptar la invitación: ${error.message}`,
        variant: "destructive",
      });
      return;
    }

    // Mark invite as accepted
    await supabase
      .from("invites" as never)
      .update({ accepted_at: new Date().toISOString() } as never)
      .eq("token", token);

    toast({
      title: "¡Bienvenido!",
      description: "Te uniste al club exitosamente.",
      variant: "success",
    });

    router.push("/teams");
    router.refresh();
  }

  return (
    <Button
      onClick={handleAccept}
      disabled={loading}
      className="w-full min-h-12"
    >
      {loading ? "Procesando…" : "Aceptar invitación"}
    </Button>
  );
}
