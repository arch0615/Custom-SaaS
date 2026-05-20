import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Bell,
  Boxes,
  FileText,
  Mail,
  MessageCircle,
  Monitor,
  PlayCircle,
  Sparkles,
  Zap,
} from "lucide-react";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.activeRole === "client" ? "/portal" : "/app");
  }

  return (
    <div className="min-h-svh bg-stone-100 text-stone-900">
      <SiteHeader />
      <main>
        <Hero />
        <TrustStrip />
        <Features />
        <HowItWorks />
        <Differentiators />
        <Pricing />
      </main>
      <SiteFooter />
    </div>
  );
}

function BrandMark({ size = "default" }: { size?: "default" | "lg" }) {
  const box = size === "lg" ? "size-10" : "size-8";
  const icon = size === "lg" ? "size-5" : "size-4";
  const text = size === "lg" ? "text-lg" : "text-base";
  return (
    <Link href="/" className="inline-flex items-center gap-2">
      <span className={`inline-flex ${box} items-center justify-center rounded-lg bg-teal-700 text-white shadow-sm`}>
        <Boxes className={icon} />
      </span>
      <span className={`${text} font-semibold tracking-tight`}>Aduanasync</span>
    </Link>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/60 bg-stone-100/80 backdrop-blur supports-[backdrop-filter]:bg-stone-100/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <BrandMark />
        <nav className="hidden items-center gap-8 text-sm text-stone-600 lg:flex">
          <a href="#recursos" className="hover:text-stone-900">Recursos</a>
          <a href="#como" className="hover:text-stone-900">Como funciona</a>
          <a href="#precos" className="hover:text-stone-900">Preços</a>
          <a href="mailto:contato@aduanasync.com.br" className="hover:text-stone-900">Contato</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-md px-3 py-2 text-sm font-medium text-stone-700 hover:text-stone-900"
          >
            Entrar
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800"
          >
            Começar agora
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="border-b border-stone-200/60">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-2 lg:items-center lg:py-24">
        <div className="space-y-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
            Para despachantes aduaneiros
          </p>
          <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
            Acompanhe cada processo.
            <br />
            Tranquilize cada cliente.
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-stone-600">
            Substitua planilhas, e-mails e WhatsApp por um portal de rastreamento profissional.
            Seu cliente vê o status do processo em tempo real — sem precisar te ligar.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-md bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800"
            >
              Começar agora
              <ArrowRight className="size-4" />
            </Link>
            <a
              href="#como"
              className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-800 shadow-sm transition-colors hover:bg-stone-50"
            >
              <PlayCircle className="size-4" />
              Ver demonstração
            </a>
          </div>
        </div>
        <div className="relative">
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-200 shadow-xl">
            <Image
              src="/marketing/hero-dashboard.jpg"
              alt="Dashboard do Aduanasync com timeline de processo aduaneiro"
              width={1600}
              height={1100}
              priority
              className="h-auto w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  return (
    <section className="border-b border-stone-200/60 bg-stone-100/50">
      <div className="mx-auto max-w-6xl px-6 py-6">
        <p className="text-center text-sm text-stone-600">
          Construído para brokers no Brasil · LGPD-compliant · Multi-tenant
        </p>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    {
      icon: Activity,
      title: "Timeline tipo Correios",
      body: "Cada etapa, cada documento, cada atualização. Estilo rastreamento que seu cliente já conhece.",
    },
    {
      icon: FileText,
      title: "Central de documentos",
      body: "Invoice, BL, Packing List, DI. Tudo em um lugar, com prévia e versionamento.",
    },
    {
      icon: Bell,
      title: "Notificações automáticas",
      body: "Cliente é avisado por e-mail e no portal a cada avanço. Você decide o quê e quando.",
    },
  ];
  return (
    <section id="recursos" className="scroll-mt-20 border-b border-stone-200/60">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
            Tudo que você precisa
          </h2>
          <p className="text-lg text-stone-600">
            Uma suite completa para gerenciar processos aduaneiros e manter clientes informados.
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="rounded-2xl border border-stone-200 bg-white p-7 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-5 inline-flex size-11 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                <Icon className="size-5" />
              </div>
              <h3 className="mb-2 text-lg font-semibold tracking-tight text-stone-900">{title}</h3>
              <p className="text-sm leading-relaxed text-stone-600">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Você cadastra o processo",
      body: "Crie um novo processo em minutos. Adicione rotas, documentos de transporte, cliente e referências. O sistema sugere número interno automático.",
      img: "/marketing/step-1-process.jpg",
      alt: "Mockup do formulário de novo processo",
    },
    {
      n: "02",
      title: "Seu cliente recebe o convite",
      body: "O cliente é convidado por e-mail para acessar o portal. Ele cria a senha e já vê todos os processos da empresa dele.",
      img: "/marketing/step-2-invite.jpg",
      alt: "Envelope de convite por e-mail",
    },
    {
      n: "03",
      title: "Ele acompanha em tempo real",
      body: "O portal do cliente mostra cada etapa do processo, documentos disponíveis e timeline de atualizações. Tudo no celular ou desktop.",
      img: "/marketing/step-3-tracking.jpg",
      alt: "Aplicativo de rastreamento em um celular",
    },
    {
      n: "04",
      title: "Você foca no trabalho aduaneiro",
      body: "Com menos interrupções, você gerencia mais processos. Dashboard com KPIs, alertas de atraso e central de notificações.",
      img: "/marketing/step-4-dashboard.jpg",
      alt: "Dashboard com indicadores e gráficos",
    },
  ];
  return (
    <section id="como" className="scroll-mt-20 border-b border-stone-200/60">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
            Como funciona
          </h2>
          <p className="text-lg text-stone-600">
            Quatro passos simples para transformar a experiência dos seus clientes.
          </p>
        </div>
        <div className="mt-16 space-y-20 lg:space-y-28">
          {steps.map((s, i) => {
            const reverse = i % 2 === 1;
            return (
              <div
                key={s.n}
                className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${reverse ? "lg:[&>:first-child]:order-2" : ""}`}
              >
                <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-200 shadow-sm">
                  <Image
                    src={s.img}
                    alt={s.alt}
                    width={1400}
                    height={1000}
                    className="h-auto w-full object-cover"
                  />
                </div>
                <div className="space-y-4">
                  <span className="block text-5xl font-bold tracking-tight text-teal-700/60">{s.n}</span>
                  <h3 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">{s.title}</h3>
                  <p className="max-w-lg text-base leading-relaxed text-stone-600">{s.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Differentiators() {
  const items = [
    { icon: Sparkles, title: "Simplicidade", body: "Interface limpa e intuitiva, sem curva de aprendizado." },
    { icon: Monitor, title: "Experiência", body: "Portal profissional que impressiona seus clientes." },
    { icon: Zap, title: "Automação", body: "Notificações e lembretes que economizam seu tempo." },
    { icon: MessageCircle, title: "Comunicação", body: "Troca de documentos e mensagens em um só lugar." },
  ];
  return (
    <section className="border-b border-stone-200/60 bg-stone-100/40">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
            Por que escolher a Aduanasync
          </h2>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {items.map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="flex items-start gap-4 rounded-2xl border border-stone-200 bg-white p-6"
            >
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-700">
                <Icon className="size-5" />
              </span>
              <div className="space-y-1">
                <h3 className="text-base font-semibold tracking-tight text-stone-900">{title}</h3>
                <p className="text-sm leading-relaxed text-stone-600">{body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="precos" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
            Preços
          </h2>
          <p className="text-lg text-stone-600">
            Estamos preparando planos flexíveis para despachantes de todos os tamanhos.
          </p>
        </div>
        <div className="mx-auto mt-12 max-w-md">
          <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
            <span className="mx-auto mb-5 inline-flex size-12 items-center justify-center rounded-full bg-stone-100 text-stone-600">
              <Mail className="size-5" />
            </span>
            <h3 className="mb-2 text-xl font-semibold tracking-tight text-stone-900">Em breve</h3>
            <p className="mb-6 text-sm leading-relaxed text-stone-600">
              Por enquanto, fale com a gente. Vamos entender suas necessidades e preparar a melhor proposta.
            </p>
            <a
              href="mailto:contato@aduanasync.com.br"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800"
            >
              <Mail className="size-4" />
              Falar com a gente
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-stone-200/60 bg-stone-200/60">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <BrandMark />
          </div>
          <p className="max-w-sm text-sm text-stone-600 sm:text-right">
            Acompanhe cada processo. Tranquilize cada cliente.
          </p>
        </div>
        <div className="mt-8 flex flex-col gap-3 border-t border-stone-300/60 pt-6 text-sm text-stone-600 sm:flex-row sm:items-center sm:justify-between">
          <nav className="flex items-center gap-6">
            <a href="#recursos" className="hover:text-stone-900">Produto</a>
            <a href="mailto:contato@aduanasync.com.br" className="hover:text-stone-900">Contato</a>
            <a href="#" className="hover:text-stone-900">LGPD</a>
          </nav>
          <p>© 2026 Aduanasync. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
