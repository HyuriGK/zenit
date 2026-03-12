'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Loader2, UserPlus, Github, Mail, User, ShieldCheck, Target, Zap, Clock } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Sua jornada começa agora!');
                router.push('/login');
            } else {
                toast.error(data.error || 'Erro ao criar conta');
            }
        } catch (error) {
            toast.error('Falha na conexão. Tente novamente em instantes.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-[#0a0a0a] text-white selection:bg-emerald-500/30 overflow-hidden font-sans">
            {/* Left Panel: Aspirational/Productivity Visuals (Same as Login) */}
            <div className="hidden lg:flex flex-col justify-between w-[55%] p-12 bg-[#0d0d0d] relative overflow-hidden border-r border-zinc-800/50">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-1000" />
                
                <div className="absolute inset-0 opacity-[0.05]" 
                     style={{ backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

                <div className="relative z-10 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-600 rounded-xl flex items-center justify-center shadow-[0_0_30px_rgba(52,211,153,0.3)]">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-2xl font-black tracking-tighter bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">ZÊNIT</span>
                </div>

                <div className="relative z-10 max-w-xl">
                    <h2 className="text-6xl font-black tracking-tight leading-[0.9] mb-8 animate-in fade-in slide-in-from-left-8 duration-700 delay-200">
                        Crie uma vida <span className="text-emerald-500 italic">extraordinária</span> através da <span className="underline decoration-emerald-500/30 underline-offset-8">ordem</span>.
                    </h2>
                    
                    <div className="grid grid-cols-2 gap-6 mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
                        <div className="p-6 bg-zinc-900/40 rounded-3xl border border-zinc-800/50 backdrop-blur-sm group hover:border-emerald-500/30 transition-all">
                            <Target className="w-10 h-10 text-emerald-400 mb-4 group-hover:scale-110 transition-transform" />
                            <h3 className="font-bold text-lg mb-1">Foco Total</h3>
                            <p className="text-zinc-500 text-sm leading-relaxed">Elimine distrações e concentre sua energia no que realmente importa.</p>
                        </div>
                        <div className="p-6 bg-zinc-900/40 rounded-3xl border border-zinc-800/50 backdrop-blur-sm group hover:border-blue-500/30 transition-all">
                            <Clock className="w-10 h-10 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
                            <h3 className="font-bold text-lg mb-1">Hábito de Vencer</h3>
                            <p className="text-zinc-500 text-sm leading-relaxed">Construa rotinas sólidas que te levam ao sucesso diariamente.</p>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 flex items-center gap-6 animate-in fade-in duration-1000 delay-1000">
                    <div className="flex -space-x-3">
                        {[5, 6, 7, 8].map((i) => (
                            <div key={i} className="w-10 h-10 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-[10px] font-bold">
                                {String.fromCharCode(64 + i)}
                            </div>
                        ))}
                    </div>
                    <p className="text-zinc-500 text-xs font-medium max-w-xs">
                        Prepare-se para uma experiência de alta performance.
                    </p>
                </div>

                <div className="absolute right-[-10%] top-[40%] w-64 h-64 bg-emerald-500/20 rounded-full blur-[100px] animate-pulse" />
            </div>

            {/* Right Panel: Registration Form */}
            <div className="flex-1 flex flex-col justify-center items-center p-8 relative overflow-y-auto">
                <div className="lg:hidden absolute inset-0 z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-emerald-500/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] bg-blue-500/10 rounded-full blur-[120px]" />
                </div>

                <div className="w-full max-w-[420px] relative z-10 animate-in fade-in zoom-in-95 duration-500 my-8">
                    <div className="lg:hidden mb-8 text-center">
                        <div className="mx-auto w-14 h-14 bg-gradient-to-br from-emerald-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
                            <Sparkles className="w-7 h-7 text-white" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight">ZÊNIT</h1>
                    </div>

                    <div className="mb-8 text-left lg:block hidden">
                        <h1 className="text-4xl font-extrabold tracking-tight mb-2">Novo Membro</h1>
                        <p className="text-zinc-500 text-lg">Comece a organizar sua vida agora.</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-zinc-400 ml-1 text-xs font-bold uppercase tracking-widest text-zinc-500">Nome Completo</Label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" />
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Como quer ser chamado?"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="bg-zinc-900/50 border-zinc-800 text-white h-14 pl-12 rounded-2xl focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all border-2"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-zinc-400 ml-1 text-xs font-bold uppercase tracking-widest text-zinc-500">Email</Label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu@exemplo.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-zinc-900/50 border-zinc-800 text-white h-14 pl-12 rounded-2xl focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all border-2"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-zinc-400 ml-1 text-xs font-bold uppercase tracking-widest text-zinc-500">Senha</Label>
                            <div className="relative group">
                                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Crie uma senha forte"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="bg-zinc-900/50 border-zinc-800 text-white h-14 pl-12 rounded-2xl focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all border-2"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-2xl transition-all active:scale-[0.98] shadow-[0_10px_20px_-5px_rgba(16,185,129,0.4)] mt-4 border-none text-lg uppercase tracking-widest group"
                        >
                            {loading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <span className="flex items-center gap-2">
                                    Iniciar Jornada <Zap className="w-5 h-5 group-hover:scale-125 transition-transform" />
                                </span>
                            )}
                        </Button>
                    </form>

                    <div className="relative my-10">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-zinc-800" />
                        </div>
                        <div className="relative flex justify-center text-[10px] items-center gap-2 uppercase font-black tracking-widest text-zinc-500">
                            <span className="bg-[#0a0a0a] px-4">Ou via redes sociais</span>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Button variant="outline" className="flex-1 h-12 bg-transparent border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 text-white rounded-xl transition-all" onClick={() => toast.info('GitHub em breve')}>
                            <Github size={20} className="mr-2" /> GitHub
                        </Button>
                        <Button variant="outline" className="flex-1 h-12 bg-transparent border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 text-white rounded-xl transition-all" onClick={() => toast.info('Google em breve')}>
                            <Github size={20} className="mr-2" /> Google
                        </Button>
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-zinc-500 text-sm font-medium">
                            Já faz parte do ecossistema?{' '}
                            <Link href="/login" className="text-white font-bold hover:text-emerald-400 transition-colors">
                                Fazer Login
                            </Link>
                        </p>
                    </div>

                    <p className="mt-8 text-zinc-600 text-[10px] text-center leading-relaxed">
                        Ao se registrar, você concorda com nossos <br />
                        <Link href="#" className="underline hover:text-zinc-400 transition-colors">Termos de Uso</Link> e <Link href="#" className="underline hover:text-zinc-400 transition-colors">Privacidade</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
