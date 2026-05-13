import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { findInviteToken } from "@/lib/data/invites";
import { AcceptInviteForm } from "./accept-form";

export const metadata = { title: "Aceitar convite" };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await findInviteToken(token);

  if (!invite) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Convite inválido</CardTitle>
            <CardDescription>
              O link expirou ou já foi utilizado. Peça um novo convite ao administrador.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login" className="text-sm underline underline-offset-4">
              Ir para o login
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invite.expires < new Date()) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Convite expirado</CardTitle>
            <CardDescription>Peça um novo convite ao administrador.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login" className="text-sm underline underline-offset-4">
              Ir para o login
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Defina sua senha</CardTitle>
          <CardDescription>
            Você foi convidado como <strong>{invite.identifier}</strong>. Crie uma senha para entrar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AcceptInviteForm token={token} />
        </CardContent>
      </Card>
    </div>
  );
}
