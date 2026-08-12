import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { findValidResetToken } from "@/lib/data/password-reset";
import { ResetForm } from "./reset-form";

export const metadata = { title: "Redefinir senha" };

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const found = await findValidResetToken(token);

  if (!found) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Link inválido ou expirado</CardTitle>
          <CardDescription>
            Este link de recuperação já foi usado ou expirou. Solicite um novo em
            &quot;Esqueci minha senha&quot;.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <Link href="/forgot-password" className="font-medium underline underline-offset-4">
            Solicitar novo link
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Definir nova senha</CardTitle>
        <CardDescription>
          Crie uma senha nova. Mínimo 8 caracteres. Este link vale por 1 hora.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResetForm token={token} />
      </CardContent>
    </Card>
  );
}
