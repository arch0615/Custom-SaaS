import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ForgotForm } from "./forgot-form";

export const metadata = { title: "Recuperar senha" };

export default function ForgotPasswordPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Esqueceu sua senha?</CardTitle>
        <CardDescription>
          Informe o e-mail cadastrado e enviaremos um link para você criar uma nova senha.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ForgotForm />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Lembrou?{" "}
          <Link href="/login" className="font-medium underline underline-offset-4">
            Voltar para o login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
