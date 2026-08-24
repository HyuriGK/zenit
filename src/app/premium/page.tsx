"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Check,
  ChevronDown,
  Star,
  ArrowRight,
  ArrowLeft,
  Crown,
  Infinity,
  Headphones,
  Eye,
  Download,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from '@/lib/auth-mock';
import { toast } from "sonner";

export default function PremiumPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const handleAssinarClick = () => {
    if (session?.user?.plano === 'PREMIUM') {
      toast.info('Você já é um assinante Premium!', {
        description: 'Acesse o dashboard para gerenciar sua assinatura.',
        action: {
          label: 'Ver Assinatura',
          onClick: () => router.push('/dashboard/assinatura'),
        },
      });
      return;
    }

    router.push('/premium/checkout');
  };

  const premiumFeatures = [
    {
      icon: Infinity,
      title: "Módulos Ilimitados",
      description: "Acesso completo a todos os módulos sem nenhum limite de uso.",
    },
    {
      icon: Shield,
      title: "Backup Automático",
      description: "Seus dados são salvos automaticamente na nuvem todos os dias.",
    },
    {
      icon: Headphones,
      title: "Suporte Prioritário",
      description: "Atendimento rápido e dedicado para resolver suas dúvidas.",
    },
    {
      icon: BarChart3,
      title: "Relatórios Avançados",
      description: "Análises detalhadas e insights sobre sua produtividade.",
    },
    {
      icon: Download,
      title: "Exportação Completa",
      description: "Exporte seus dados em PDF, Excel e outros formatos.",
    },
    {
      icon: Eye,
      title: "Acesso Antecipado",
      description: "Seja o primeiro a testar novos recursos e funcionalidades.",
    },
  ];

  const comparisonData = [
    { feature: "Compromissos na Agenda", free: "10/mês", premium: "Ilimitado" },
    { feature: "Transações Financeiras", free: "20/mês", premium: "Ilimitado" },
    { feature: "Cursos Ativos", free: "1", premium: "Ilimitado" },
    { feature: "Backup de Dados", free: "—", premium: "Diário" },
    { feature: "Relatórios", free: "Básico", premium: "Avançado" },
    { feature: "Exportação", free: "—", premium: "PDF/Excel" },
    { feature: "Suporte", free: "Comunidade", premium: "Prioritário" },
    { feature: "Novos Recursos", free: "—", premium: "Acesso Antecipado" },
    { feature: "Anúncios", free: "Sim", premium: "Sem Anúncios" },
  ];

  const testimonials = [
    {
      name: "Rafael Mendes",
      role: "Desenvolvedor",
      text: "O Premium vale cada centavo. Os relatórios avançados me ajudaram a entender onde estava perdendo tempo.",
    },
    {
      name: "Julia Oliveira",
      role: "Estudante",
      text: "Com o desconto de estudante, ficou super acessível. Consigo gerenciar todos os meus cursos sem limite!",
    },
    {
      name: "Pedro Costa",
      role: "Empreendedor",
      text: "A exportação em PDF é perfeita para apresentar relatórios financeiros aos meus sócios.",
    },
  ];

  const faqs = [
    {
      question: "Posso testar o Premium antes de assinar?",
      answer: "Sim! Oferecemos 7 dias de teste grátis para você experimentar todos os recursos Premium sem compromisso.",
    },
    {
      question: "Como funciona o pagamento?",
      answer: "Aceitamos cartão de crédito, débito e PIX. O pagamento é processado de forma segura e você pode cancelar a qualquer momento.",
    },
    {
      question: "Existe desconto para pagamento anual?",
      answer: "Sim! No plano anual você economiza 16%, pagando apenas R$ 129/ano em vez de R$ 154,80.",
    },
    {
      question: "O que acontece se eu cancelar?",
      answer: "Você continua com acesso Premium até o fim do período pago. Depois, sua conta volta para o plano gratuito e seus dados são mantidos.",
    },
  ];

  const isPremium = session?.user?.plano === 'PREMIUM';

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white overflow-x-hidden">
      {/* Gradient Orbs Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-40 w-80 h-80 bg-emerald-600/30 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute top-1/4 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-amber-600/20 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '4s' }} />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0F]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <img src="/images/logo-sem-fundo.png" alt="Logo Azimov" className="h-10 w-10 rounded-xl object-contain" />
              <span className="text-3xl font-bold bg-gradient-to-r from-green-400 via-teal-400 to-blue-400 bg-clip-text text-transparent animate-gradient">
                Azimov
              </span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#recursos" className="text-sm text-gray-400 hover:text-white transition-colors">
                Recursos
              </a>
              <a href="#comparativo" className="text-sm text-gray-400 hover:text-white transition-colors">
                Comparativo
              </a>
              <a href="#faq" className="text-sm text-gray-400 hover:text-white transition-colors">
                FAQ
              </a>
            </nav>

            {/* Back Button */}
            <Button
              variant="ghost"
              className="text-gray-300 hover:text-white hover:bg-white/5"
              onClick={() => router.push('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 mb-8 animate-fade-in">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-amber-300">Desbloqueie todo o potencial do Azimov</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-in-delay-1">
              <span className="text-white">Azimov</span>
              <br />
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 bg-clip-text text-transparent">
                Premium
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-delay-2">
              Remova todos os limites e tenha acesso completo a todos os módulos,
              relatórios avançados, suporte prioritário e muito mais.
            </p>

            {/* Pricing CTA */}
            <div className="max-w-sm mx-auto animate-fade-in-delay-3">
              <div className="p-8 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30">
                <div className="mb-4">
                  <span className="text-5xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                    R$ 12,90
                  </span>
                  <span className="text-gray-400">/mês</span>
                </div>
                <p className="text-sm text-gray-500 mb-6">ou R$ 129/ano (economize 16%)</p>

                {isPremium ? (
                  <Button
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => router.push('/dashboard/assinatura')}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Você já é Premium
                  </Button>
                ) : (
                  <Button
                    className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium shadow-lg shadow-amber-500/25"
                    onClick={handleAssinarClick}
                  >
                    Assinar Premium
                    <Star className="w-4 h-4 ml-2" />
                  </Button>
                )}

                <p className="text-xs text-gray-500 mt-4">
                  7 dias de teste grátis • Cancele quando quiser
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="recursos" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-amber-500/10 text-amber-300 border-amber-500/20 hover:bg-amber-500/20">
              Recursos Premium
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Tudo que você precisa para{" "}
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                alcançar seus objetivos
              </span>
            </h2>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {premiumFeatures.map((feature, i) => (
              <div
                key={i}
                className="group relative p-6 rounded-2xl bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-white/5 hover:border-amber-500/20 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-4 shadow-lg">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section id="comparativo" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-amber-950/10 to-transparent">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20">
              Comparativo
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Free vs{" "}
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                Premium
              </span>
            </h2>
          </div>

          {/* Comparison Table */}
          <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-3 gap-4 p-6 bg-white/5 border-b border-white/10">
              <div className="text-sm font-medium text-gray-400">Recurso</div>
              <div className="text-center text-sm font-medium text-gray-400">Free</div>
              <div className="text-center">
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                  Premium
                </Badge>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-white/5">
              {comparisonData.map((item, i) => (
                <div key={i} className="grid grid-cols-3 gap-4 p-4 hover:bg-white/5 transition-colors">
                  <div className="text-sm text-white">{item.feature}</div>
                  <div className="text-center text-sm text-gray-500">{item.free}</div>
                  <div className="text-center text-sm text-amber-400 font-medium">{item.premium}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            {!isPremium && (
              <Button
                className="h-12 px-8 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium shadow-lg shadow-amber-500/25"
                onClick={handleAssinarClick}
              >
                Fazer Upgrade Agora
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20">
              Depoimentos
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              O que nossos usuários{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Premium dizem
              </span>
            </h2>
          </div>

          {/* Testimonials Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10">
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-gray-300 mb-6 text-sm leading-relaxed">
                  "{testimonial.text}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-sm font-semibold text-white">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-white text-sm">{testimonial.name}</div>
                    <div className="text-xs text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-emerald-950/20 to-transparent">
        <div className="max-w-3xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-cyan-500/10 text-cyan-300 border-cyan-500/20 hover:bg-cyan-500/20">
              FAQ
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Perguntas sobre o{" "}
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                Premium
              </span>
            </h2>
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="group p-6 rounded-2xl bg-white/5 border border-white/10 cursor-pointer hover:border-white/20 transition-colors"
              >
                <summary className="flex justify-between items-center font-medium text-white list-none">
                  {faq.question}
                  <ChevronDown className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" />
                </summary>
                <p className="mt-4 text-gray-400 text-sm leading-relaxed">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative p-12 md:p-16 rounded-3xl overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />

            {/* Content */}
            <div className="relative text-center">
              <Crown className="w-16 h-16 mx-auto mb-6 text-white/90" />
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                Pronto para o próximo nível?
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
                Desbloqueie todo o potencial do Azimov e transforme sua produtividade hoje.
              </p>

              {isPremium ? (
                <Button
                  className="h-12 px-8 bg-white text-amber-600 hover:bg-white/90 font-medium"
                  onClick={() => router.push('/dashboard')}
                >
                  Ir para o Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  className="h-12 px-8 bg-white text-amber-600 hover:bg-white/90 font-medium"
                  onClick={handleAssinarClick}
                >
                  Começar Agora — R$ 12,90/mês
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <span className="text-2xl font-bold bg-gradient-to-r from-green-400 via-teal-400 to-blue-400 bg-clip-text text-transparent animate-gradient">
              Azimov
            </span>
            <p className="text-sm text-gray-500">
              © 2026 Azimov. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
