'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Loader2, LogIn, Github, Mail } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                toast.error('Credenciais inválidas. Verifique seu email e senha.');
            } else {
                toast.success('Bem-vindo ao Zênit!');
                router.push('/dashboard');
                router.refresh();
            }
        } catch (error) {
            toast.error('Falha na conexão. Tente novamente em instantes.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden font-sans">
            {/* Mesh Gradient Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-700" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] bg-green-500/5 rounded-full blur-[100px]" />
            </div>

            {/* Subtle Grid Pattern */}
            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            <div className="w-full max-w-[440px] px-6 relative z-10">
                <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-600 rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(52,211,153,0.2)] mb-6 ring-1 ring-white/20">
                        <Sparkles className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
                        Zênit
                    </h1>
                    <p className="text-zinc-400 text-lg font-medium">
                        Sua produtividade em um novo nível.
                    </p>
                </div>

                <Card className="bg-zinc-900/40 border-zinc-800/50 backdrop-blur-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] rounded-[2.5rem] overflow-hidden border-t-zinc-700/30 animate-in fade-in zoom-in-95 duration-700 delay-200">
                    <CardHeader className="space-y-1 pt-10 pb-6 px-10">
                        <CardTitle className="text-2xl font-bold text-white">Login</CardTitle>
                        <CardDescription className="text-zinc-500">
                            Insira suas credenciais para continuar
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="px-10 pb-8">
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-2.5">
                                <Label htmlFor="email" className="text-zinc-300 ml-1 text-sm font-semibold">Email</Label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="nome@exemplo.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="bg-zinc-800/30 border-zinc-700/50 text-white h-14 pl-12 rounded-2xl focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all placeholder:text-zinc-600"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between ml-1">
                                    <Label htmlFor="password" className="text-zinc-300 text-sm font-semibold">Senha</Label>
                                    <Link href="#" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
                                        Esqueceu a senha?
                                    </Link>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="bg-zinc-800/30 border-zinc-700/50 text-white h-14 rounded-2xl focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all placeholder:text-zinc-600"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-14 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold rounded-2xl transition-all active:scale-[0.98] shadow-[0_8px_20px_-4px_rgba(16,185,129,0.4)] mt-4 border-none text-lg"
                            >
                                {loading ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <span className="flex items-center gap-2">
                                        Entrar <LogIn className="w-5 h-5" />
                                    </span>
                                )}
                            </Button>
                        </form>

                        <div className="relative my-10">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-zinc-800/60" />
                            </div>
                            <div className="relative flex justify-center text-[10px] items-center gap-2 uppercase font-black tracking-widest text-zinc-600">
                                <span className="bg-[#0f0f0f] px-4 rounded-full border border-zinc-800/60 py-1">Ou continuar com</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="outline" className="h-12 bg-zinc-800/20 border-zinc-700/50 hover:bg-zinc-800/50 text-zinc-300 rounded-xl hover:text-white transition-all duration-300" onClick={() => toast.info('Integração com GitHub em breve')}>
                                <Github size={20} className="mr-2" /> GitHub
                            </Button>
                            <Button variant="outline" className="h-12 bg-zinc-800/20 border-zinc-700/50 hover:bg-zinc-800/50 text-zinc-300 rounded-xl hover:text-white transition-all duration-300" onClick={() => toast.info('Integração com Google em breve')}>
                                <Github size={20} className="mr-2" /> Google
                            </Button>
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-6 pb-10 px-10">
                        <p className="text-zinc-500 text-sm font-medium">
                            Novo por aqui?{' '}
                            <Link href="/register" className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors underline-offset-4 hover:underline">
                                Criar conta gratuita
                            </Link>
                        </p>
                    </CardFooter>
                </Card>

                {/* Footer Text */}
                <div className="text-center mt-8 animate-in fade-in duration-1000 delay-500">
                    <p className="text-zinc-600 text-xs font-medium tracking-wide flex items-center justify-center gap-1.5 uppercase">
                        &copy; 2025 Zênit <span className="w-1 h-1 rounded-full bg-zinc-800" /> Transformando sua produtividade
                    </p>
                </div>
            </div>
        </div>
    );
}
