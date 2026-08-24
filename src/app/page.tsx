"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Wallet,
  BookOpen,
  Target,
  Dumbbell,
  TrendingUp,
  Users,
  Shield,
  Zap,
  Check,
  ChevronDown,
  Star,
  ArrowRight,
  Lock,
  Menu,
  X,
  Globe,
  BarChart3,
  Clock,
  Brain,
  Layers,
  MousePointerClick,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function LandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showOrbs, setShowOrbs] = useState(false);

  // Performance: Lazy load orbs após first paint
  useEffect(() => {
    const timeout = setTimeout(() => setShowOrbs(true), 100);
    return () => clearTimeout(timeout);
  }, []);

  // Performance: Scroll listener otimizado com RAF throttle
  useEffect(() => {
    let ticking = false;
    let lastKnownScrollY = 0;

    const handleScroll = () => {
      lastKnownScrollY = window.scrollY;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(lastKnownScrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, nome }),
      });

      if (response.ok) {
        setSubmitted(true);
        setEmail("");
        setNome("");
        toast.success("Você entrou na lista de espera!");
      }
    } catch (error) {
      console.error("Erro ao adicionar à lista de espera:", error);
      toast.error("Erro ao processar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const modules = [
    {
      icon: Calendar,
      title: "Agenda Inteligente",
      description: "Organize compromissos com lembretes inteligentes e sincronização automática.",
      gradient: "from-blue-500 to-cyan-400",
      bgGradient: "from-blue-500/10 to-cyan-400/10",
    },
    {
      icon: Wallet,
      title: "Controle Financeiro",
      description: "Gerencie receitas, despesas e investimentos com dashboards completos.",
      gradient: "from-emerald-500 to-teal-400",
      bgGradient: "from-emerald-500/10 to-teal-400/10",
    },
    {
      icon: BookOpen,
      title: "Gestão do Planner",
      description: "Acompanhe cursos, anotações e progresso com técnicas de aprendizado.",
      gradient: "from-emerald-500 to-green-400",
      bgGradient: "from-emerald-500/10 to-green-400/10",
    },
    {
      icon: Target,
      title: "Metas Pessoais",
      description: "Defina objetivos SMART e acompanhe sua evolução.",
      gradient: "from-rose-500 to-teal-400",
      bgGradient: "from-rose-500/10 to-teal-400/10",
      comingSoon: true,
    },
    {
      icon: Dumbbell,
      title: "Treinos e Saúde",
      description: "Planeje treinos e monitore sua evolução física.",
      gradient: "from-red-500 to-orange-400",
      bgGradient: "from-red-500/10 to-orange-400/10",
      comingSoon: true,
    },
  ];

  const benefits = [
    {
      icon: Zap,
      title: "Produtividade 10x",
      description: "Centralize tudo em um só lugar e economize horas por semana.",
    },
    {
      icon: Shield,
      title: "Segurança Total",
      description: "Dados criptografados e protegidos seguindo padrões LGPD.",
    },
    {
      icon: Brain,
      title: "Insights Inteligentes",
      description: "Análises personalizadas baseadas nos seus dados e padrões.",
    },
    {
      icon: Layers,
      title: "Tudo Integrado",
      description: "Módulos que conversam entre si para uma experiência única.",
    },
  ];

  const stats = [
    { value: "7+", label: "Módulos Integrados" },
    { value: "100%", label: "Dados Privados" },
    { value: "500+", label: "Na Lista de Espera" },
    { value: "R$12,90", label: "Plano Premium/mês" },
  ];

  const testimonials = [
    {
      name: "Ana Silva",
      role: "Empreendedora",
      image: null,
      text: "Finalmente consigo ter uma visão completa da minha vida. Economizei mais de R$ 2.000 em 3 meses com o módulo financeiro!",
    },
    {
      name: "Carlos Santos",
      role: "Estudante de Medicina",
      image: null,
      text: "Organizei todo o meu planner no Zênit. A produtividade aumentou muito e consigo acompanhar meu progresso de forma visual.",
    },
    {
      name: "Mariana Costa",
      role: "Designer",
      image: null,
      text: "Simplesmente incrível. Cancelei 5 assinaturas de apps diferentes e agora uso só o Zênit. Vale cada centavo!",
    },
  ];

  const faqs = [
    {
      question: "Quando o Zênit estará disponível?",
      answer: "Estamos finalizando os testes beta e planejamos o lançamento oficial para fevereiro de 2026. Quem estiver na lista de espera terá acesso prioritário!",
    },
    {
      question: "Meus dados estarão seguros?",
      answer: "Absolutamente. Utilizamos criptografia de ponta a ponta e seguimos os mais rigorosos padrões de segurança (LGPD compliant). Seus dados são seus e jamais serão compartilhados.",
    },
    {
      question: "Posso usar no celular?",
      answer: "Sim! O Zênit é totalmente responsivo e funciona perfeitamente em qualquer dispositivo. Apps nativos para iOS e Android estão previstos para o segundo semestre de 2026.",
    },
    {
      question: "Posso cancelar a qualquer momento?",
      answer: "Sim, sem burocracia. Você pode cancelar sua assinatura Premium a qualquer momento e continuar usando o plano gratuito.",
    },
    {
      question: "Existe desconto para estudantes?",
      answer: "Sim! Estudantes terão 50% de desconto no plano Premium. Os detalhes serão divulgados no lançamento.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white overflow-x-hidden">
      {/* Gradient Orbs Background - Performance Optimized */}
      {showOrbs && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none orb-container">
          <div className="absolute top-0 -left-40 w-80 h-80 bg-emerald-600/30 rounded-full blur-3xl animate-pulse-slow will-change-opacity" />
          <div className="absolute top-1/4 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse-slow will-change-opacity animation-delay-2000" />
          <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-cyan-600/20 rounded-full blur-3xl animate-pulse-slow will-change-opacity animation-delay-4000" />
        </div>
      )}

      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0A0A0F]/80 backdrop-blur-xl border-b border-white/5' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <img src="/images/logo.png" alt="Logo Zenit" className="h-10 w-10 rounded-xl object-cover" />
              <span className="text-3xl font-bold bg-gradient-to-r from-green-400 via-teal-400 to-blue-400 bg-clip-text text-transparent animate-gradient">
                Zênit
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#recursos" className="text-sm text-gray-400 hover:text-white transition-colors">
                Recursos
              </a>
              <a href="#como-funciona" className="text-sm text-gray-400 hover:text-white transition-colors">
                Como Funciona
              </a>
              <a href="#precos" className="text-sm text-gray-400 hover:text-white transition-colors">
                Preços
              </a>
              <a href="#faq" className="text-sm text-gray-400 hover:text-white transition-colors">
                FAQ
              </a>
            </nav>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <Button
                variant="ghost"
                className="text-gray-300 hover:text-white hover:bg-white/5"
                onClick={() => router.push('/dashboard')}
              >
                Entrar
              </Button>
              <Button
                className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white shadow-lg shadow-emerald-500/25"
                onClick={() => router.push('/dashboard')}
              >
                Começar Grátis
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-gray-400 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0A0A0F]/95 backdrop-blur-xl border-b border-white/5">
            <div className="px-4 py-6 space-y-4">
              <a href="#recursos" className="block py-2 text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                Recursos
              </a>
              <a href="#como-funciona" className="block py-2 text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                Como Funciona
              </a>
              <a href="#precos" className="block py-2 text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                Preços
              </a>
              <a href="#faq" className="block py-2 text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                FAQ
              </a>
              <div className="pt-4 flex flex-col gap-3">
                <Button className="w-full border-white/10" onClick={() => router.push('/dashboard')}>
                  Entrar
                </Button>
                <Button className="w-full bg-gradient-to-r from-emerald-600 to-blue-600" onClick={() => router.push('/dashboard')}>
                  Começar Grátis
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 mb-8 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-sm text-emerald-300">Lançamento em breve — Entre para a lista de espera</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-in-delay-1">
              <span className="text-white">Organize toda sua vida</span>
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                em um só lugar
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-delay-2">
              Zênit é a plataforma completa de produtividade pessoal que integra
              <span className="text-white font-medium"> agenda</span>,
              <span className="text-white font-medium"> finanças</span>,
              <span className="text-white font-medium"> planner</span> e muito mais.
              Tudo sincronizado, seguro e inteligente.
            </p>

            {/* CTA Form */}
            <div className="max-w-md mx-auto animate-fade-in-delay-3">
              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      type="email"
                      placeholder="Seu melhor e-mail"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                    />
                    <Button
                      type="submit"
                      disabled={loading}
                      className="h-12 px-6 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white font-medium shadow-lg shadow-emerald-500/25 whitespace-nowrap"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          Entrar na Lista
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3" />
                    Seus dados estão seguros. Sem spam, prometemos.
                  </p>
                </form>
              ) : (
                <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Check className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-emerald-300 mb-2">Você está na lista!</h3>
                  <p className="text-sm text-gray-400">
                    Avisaremos assim que o Zênit estiver disponível. Fique de olho no seu e-mail!
                  </p>
                </div>
              )}
            </div>

            {/* Social Proof */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-500 animate-fade-in-delay-4">
              <div className="flex -space-x-2">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-blue-400 border-2 border-[#0A0A0F] flex items-center justify-center text-[10px] font-medium text-white"
                  >
                    {["A", "C", "M", "R", "P"][i]}
                  </div>
                ))}
              </div>
              <span>
                <strong className="text-white">500+</strong> pessoas já na lista de espera
              </span>
            </div>
          </div>
        </div>

        {/* Hero Visual/Mockup */}
        <div className="mt-20 max-w-6xl mx-auto px-4 animate-fade-in-delay-5">
          <div className="relative">
            {/* Glow Effect - Performance Optimized */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 via-blue-600/20 to-cyan-600/20 rounded-2xl blur-2xl will-change-opacity" />

            {/* Dashboard Preview */}
            <div className="relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/10 p-2 shadow-2xl">
              <div className="bg-[#12121A] rounded-xl overflow-hidden">
                {/* Browser Chrome */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1 rounded-md bg-white/5 text-xs text-gray-500">
                      app.zenit.com/dashboard
                    </div>
                  </div>
                </div>

                {/* Dashboard Content Preview */}
                <div className="p-6 md:p-8 space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500">Bem-vindo de volta</div>
                      <div className="text-xl font-semibold text-white">Olá, usuário!</div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500" />
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Compromissos", value: "12", color: "from-blue-500 to-cyan-500" },
                      { label: "Saldo Mensal", value: "R$ 2.450", color: "from-emerald-500 to-teal-500" },
                      { label: "Cursos Ativos", value: "3", color: "from-emerald-500 to-green-500" },
                      { label: "Metas Ativas", value: "5", color: "from-orange-500 to-amber-500" },
                    ].map((stat, i) => (
                      <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <div className="text-xs text-gray-500 mb-1">{stat.label}</div>
                        <div className={`text-xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                          {stat.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Module Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {modules.slice(0, 4).map((module, i) => (
                      <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${module.gradient} flex items-center justify-center mb-3`}>
                          <module.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-sm font-medium text-white">{module.title}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features/Modules Section */}
      <section id="recursos" className="relative py-24 px-4 sm:px-6 lg:px-8">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.1),transparent)]" />
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20">
              Recursos
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Tudo que você precisa,{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                integrado
              </span>
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Pare de usar dezenas de aplicativos. Com o Zênit, você centraliza toda sua vida em uma plataforma inteligente.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module, i) => (
              <div
                key={i}
                className={`group relative p-6 rounded-2xl bg-gradient-to-br ${module.bgGradient} border border-white/5 hover:border-white/10 transition-all duration-300 hover:-translate-y-1`}
              >
                {module.comingSoon && (
                  <Badge className="absolute top-4 right-4 bg-white/10 text-white/70 border-0 text-xs">
                    Em breve
                  </Badge>
                )}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${module.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                  <module.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{module.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{module.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="como-funciona" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white/[0.02] via-emerald-950/20 to-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-500/10 text-blue-300 border-blue-500/20 hover:bg-blue-500/20">
              Como Funciona
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Simples de começar,{" "}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                poderoso de usar
              </span>
            </h2>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: MousePointerClick,
                title: "Crie sua conta",
                description: "Cadastre-se em segundos com e-mail ou Google. Sem complicação, sem cartão de crédito.",
              },
              {
                step: "02",
                icon: Layers,
                title: "Escolha seus módulos",
                description: "Ative apenas os módulos que precisa. Agenda, finanças, planner — você decide.",
              },
              {
                step: "03",
                icon: TrendingUp,
                title: "Transforme sua produtividade",
                description: "Acompanhe seu progresso com dashboards inteligentes e insights personalizados.",
              },
            ].map((item, i) => (
              <div key={i} className="relative text-center">
                {/* Connector Line */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-white/20 to-transparent" />
                )}

                <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 mb-6">
                  <item.icon className="w-10 h-10 text-white" />
                </div>
                <div className="text-xs text-emerald-400 font-semibold mb-2">PASSO {item.step}</div>
                <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8">
        {/* Subtle gradient from bottom */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_120%,rgba(16,185,129,0.08),transparent)]" />
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div>
              <Badge className="mb-4 bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20">
                Por que Zênit?
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Uma plataforma pensada para quem quer{" "}
                <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  resultados reais
                </span>
              </h2>
              <p className="text-gray-400 mb-8 leading-relaxed">
                Desenvolvemos o Zênit para pessoas que levam a sério sua produtividade e organização pessoal.
                Cada detalhe foi pensado para simplificar sua rotina e potencializar seus resultados.
              </p>

              <div className="space-y-6">
                {benefits.map((benefit, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <benefit.icon className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">{benefit.title}</h4>
                      <p className="text-sm text-gray-400">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-blue-600/20 rounded-3xl blur-2xl will-change-opacity" />
              <div className="relative grid grid-cols-2 gap-4">
                {[
                  { icon: Clock, label: "Economia de tempo", value: "5h/semana" },
                  { icon: BarChart3, label: "Aumento de foco", value: "+47%" },
                  { icon: Target, label: "Metas alcançadas", value: "3x mais" },
                  { icon: Users, label: "Usuários satisfeitos", value: "98%" },
                ].map((item, i) => (
                  <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center mb-3">
                      <item.icon className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{item.value}</div>
                    <div className="text-xs text-gray-500">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precos" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-white/[0.02]">
        {/* Background accent */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/15 to-transparent" />
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20">
              Preços
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Planos simples,{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                sem surpresas
              </span>
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Comece gratuitamente e evolua quando precisar de mais poder.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
              <p className="text-gray-400 text-sm mb-6">Perfeito para começar</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">R$ 0</span>
                <span className="text-gray-500">/mês</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Agenda básica (10 compromissos/mês)",
                  "Financeiro básico (20 transações/mês)",
                  "1 curso ativo",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                    <Check className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full h-12 border-white/10 text-white hover:bg-white/5"
                onClick={() => router.push('/dashboard')}
              >
                Começar Grátis
              </Button>
            </div>

            {/* Premium Plan */}
            <div className="relative p-8 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/30">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white border-0 shadow-lg">
                  Mais Popular
                </Badge>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Premium</h3>
              <p className="text-gray-400 text-sm mb-6">Para quem quer o máximo</p>
              <div className="mb-2">
                <span className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">R$ 12,90</span>
                <span className="text-gray-500">/mês</span>
              </div>
              <p className="text-xs text-gray-500 mb-6">ou R$ 129/ano (economize 16%)</p>
              <ul className="space-y-3 mb-8">
                {[
                  "Todos os módulos ilimitados",
                  "Backup automático de dados",
                  "Suporte prioritário",
                  "Relatórios avançados",
                  "Exportação em PDF/Excel",
                  "Sem anúncios",
                  "Acesso antecipado a novos recursos",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                    <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full h-12 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white shadow-lg shadow-emerald-500/25"
                onClick={() => router.push('/dashboard')}
              >
                Assinar Premium
                <Star className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8">
        {/* Subtle amber glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(245,158,11,0.05),transparent)]" />
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-amber-500/10 text-amber-300 border-amber-500/20 hover:bg-amber-500/20">
              Depoimentos
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              O que dizem nossos{" "}
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                beta testers
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
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-blue-400 flex items-center justify-center text-sm font-semibold text-white">
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
      <section id="faq" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-white/[0.02]">
        {/* Background accent */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-950/10 to-transparent" />
        <div className="max-w-3xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-cyan-500/10 text-cyan-300 border-cyan-500/20 hover:bg-cyan-500/20">
              FAQ
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Perguntas{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                frequentes
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
      <section className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative p-12 md:p-16 rounded-3xl overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-blue-600 to-cyan-600" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />

            {/* Content */}
            <div className="relative text-center">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                Pronto para transformar sua produtividade?
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
                Junte-se a centenas de pessoas que já estão na lista de espera do Zenit.
              </p>

              {!submitted ? (
                <form onSubmit={handleSubmit} className="max-w-md mx-auto">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      type="email"
                      placeholder="Seu melhor e-mail"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40"
                    />
                    <Button
                      type="submit"
                      disabled={loading}
                      className="h-12 px-6 bg-white text-emerald-600 hover:bg-white/90 font-medium whitespace-nowrap"
                    >
                      {loading ? "Aguarde..." : "Garantir meu lugar"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="max-w-md mx-auto p-6 rounded-2xl bg-white/10 border border-white/20">
                  <Check className="w-10 h-10 mx-auto mb-3 text-white" />
                  <p className="text-white font-medium">Você já está na lista!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <Link href="/" className="inline-block mb-4">
                <span className="text-2xl font-bold bg-gradient-to-r from-green-400 via-teal-400 to-blue-400 bg-clip-text text-transparent animate-gradient">
                  Zenit
                </span>
              </Link>
              <p className="text-sm text-gray-500 max-w-xs">
                A plataforma completa de produtividade pessoal. Organize sua vida em um só lugar.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm">Produto</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#recursos" className="text-gray-500 hover:text-white transition-colors">Recursos</a></li>
                <li><a href="#precos" className="text-gray-500 hover:text-white transition-colors">Preços</a></li>
                <li><a href="#faq" className="text-gray-500 hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4 text-sm">Empresa</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-gray-500 hover:text-white transition-colors">Sobre</a></li>
                <li><a href="#" className="text-gray-500 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-500 hover:text-white transition-colors">Carreiras</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4 text-sm">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-gray-500 hover:text-white transition-colors">Privacidade</a></li>
                <li><a href="#" className="text-gray-500 hover:text-white transition-colors">Termos</a></li>
                <li><a href="#" className="text-gray-500 hover:text-white transition-colors">LGPD</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              © 2026 Zenit. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-gray-500 hover:text-white transition-colors">
                <Globe className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
