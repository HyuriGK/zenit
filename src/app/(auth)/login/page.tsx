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
                toast.error('Email ou senha inválidos');
            } else {
                toast.success('Login realizado com sucesso!');
                router.push('/dashboard');
                router.refresh();
            }
        } catch (error) {
            toast.error('Ocorreu um erro ao tentar fazer login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

            <Card className="w-full max-w-md bg-zinc-900/50 border-zinc-800 backdrop-blur-xl relative z-10 shadow-2xl rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-blue-500/5 pointer-events-none" />

                <CardHeader className="text-center pt-8">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20 mb-4 animate-in fade-in zoom-in duration-500">
                        <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                        Bem-vindo de volta
                    </CardTitle>
                    <CardDescription className="text-zinc-500 text-base mt-2">
                        Acesse sua conta no Zênit
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-zinc-400">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-zinc-800/50 border-zinc-700/50 text-white h-12 rounded-xl focus:ring-green-500/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-zinc-400">Senha</Label>
                                <Link href="#" className="text-xs text-green-500 hover:text-green-400 transition-colors">
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
                                className="bg-zinc-800/50 border-zinc-700/50 text-white h-12 rounded-xl focus:ring-green-500/20"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-white hover:bg-zinc-200 text-black font-bold rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-white/5"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <span className="flex items-center gap-2">
                                    <LogIn className="w-5 h-5" /> Entrar
                                </span>
                            )}
                        </Button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-zinc-800" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-[#0a0a0a] px-2 text-zinc-600">Ou continue com</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" className="h-12 bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800 text-white rounded-xl border-zinc-700/50 transition-all hover:border-zinc-600" onClick={() => toast.info('Ainda não configurado')}>
                            <Github size={20} className="mr-2" /> GitHub
                        </Button>
                        <Button variant="outline" className="h-12 bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800 text-white rounded-xl border-zinc-700/50 transition-all hover:border-zinc-600" onClick={() => toast.info('Ainda não configurado')}>
                            <Github size={20} className="mr-2" /> Google
                        </Button>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-2 pb-8">
                    <p className="text-zinc-500 text-sm">
                        Não tem uma conta?{' '}
                        <Link href="/register" className="text-green-500 font-medium hover:underline">
                            Crie uma agora
                        </Link>
                    </p>
                </CardFooter>
            </Card>

            {/* Footer Text */}
            <div className="absolute bottom-6 text-zinc-600 text-xs">
                &copy; 2025 Zênit - Transformando sua produtividade
            </div>
        </div>
    );
}
