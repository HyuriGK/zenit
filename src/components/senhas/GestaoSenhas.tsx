'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    KeyRound,
    Plus,
    Search,
    Eye,
    EyeOff,
    Copy,
    Pencil,
    Trash2,
    Loader2,
    Globe,
    User,
    Lock,
    Tag,
    StickyNote,
    PenTool,
    CheckCircle2,
    AlertCircle,
    ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

interface Senha {
    id: string;
    nome: string;
    url?: string;
    usuario: string;
    senha: string;
    categoria?: string;
    notas?: string;
    cor: string;
    createdAt: string;
    updatedAt: string;
}

const CATEGORIAS = [
    { valor: 'email', label: 'E-mail', emoji: '📧' },
    { valor: 'redes_sociais', label: 'Redes Sociais', emoji: '📱' },
    { valor: 'banco', label: 'Banco / Financeiro', emoji: '🏦' },
    { valor: 'trabalho', label: 'Trabalho', emoji: '💼' },
    { valor: 'streaming', label: 'Streaming', emoji: '🎬' },
    { valor: 'compras', label: 'Compras', emoji: '🛒' },
    { valor: 'governo', label: 'Governo', emoji: '🏛️' },
    { valor: 'outros', label: 'Outros', emoji: '🔑' },
];

const CORES = [
    '#059669', '#3b82f6', '#8b5cf6', '#ec4899',
    '#f59e0b', '#ef4444', '#06b6d4', '#84cc16',
];

function categoriaBadge(cat?: string) {
    const found = CATEGORIAS.find(c => c.valor === cat);
    return found ? `${found.emoji} ${found.label}` : null;
}

function SenhaCard({
    item,
    onEditar,
    onExcluir,
}: {
    item: Senha;
    onEditar: (s: Senha) => void;
    onExcluir: (id: string) => void;
}) {
    const [revelar, setRevelar] = useState(false);
    const [copiandoSenha, setCopiandoSenha] = useState(false);
    const [copiandoUsuario, setCopiandoUsuario] = useState(false);

    const copiar = async (texto: string, tipo: 'senha' | 'usuario') => {
        await navigator.clipboard.writeText(texto);
        if (tipo === 'senha') {
            setCopiandoSenha(true);
            setTimeout(() => setCopiandoSenha(false), 1500);
        } else {
            setCopiandoUsuario(true);
            setTimeout(() => setCopiandoUsuario(false), 1500);
        }
        toast.success(tipo === 'senha' ? 'Senha copiada!' : 'Usuário copiado!');
    };

    const badge = categoriaBadge(item.categoria);

    return (
        <div className="group bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5 hover:border-zinc-700/80 hover:bg-zinc-900/80 transition-all duration-200">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
                        style={{ backgroundColor: `${item.cor}22`, border: `1px solid ${item.cor}44` }}
                    >
                        <KeyRound className="w-5 h-5" style={{ color: item.cor }} />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-white text-sm truncate">{item.nome}</h3>
                        {item.url && (
                            <a
                                href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-zinc-500 hover:text-emerald-400 transition-colors truncate flex items-center gap-1 mt-0.5"
                            >
                                <Globe className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{item.url.replace(/^https?:\/\//, '')}</span>
                                <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                            </a>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onEditar(item)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
                        title="Editar"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => onExcluir(item.id)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Excluir"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between bg-zinc-800/40 rounded-xl px-3 py-2 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <User className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                        <span className="text-xs text-zinc-300 truncate font-medium">{item.usuario}</span>
                    </div>
                    <button
                        onClick={() => copiar(item.usuario, 'usuario')}
                        className="text-zinc-500 hover:text-white transition-colors flex-shrink-0"
                        title="Copiar usuário"
                    >
                        {copiandoUsuario
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            : <Copy className="w-3.5 h-3.5" />
                        }
                    </button>
                </div>

                <div className="flex items-center justify-between bg-zinc-800/40 rounded-xl px-3 py-2 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <Lock className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                        <span className="text-xs text-zinc-300 font-mono truncate">
                            {revelar ? item.senha : '•'.repeat(Math.min(item.senha.length, 16))}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                            onClick={() => setRevelar(v => !v)}
                            className="text-zinc-500 hover:text-white transition-colors"
                            title={revelar ? 'Ocultar senha' : 'Revelar senha'}
                        >
                            {revelar
                                ? <EyeOff className="w-3.5 h-3.5" />
                                : <Eye className="w-3.5 h-3.5" />
                            }
                        </button>
                        <button
                            onClick={() => copiar(item.senha, 'senha')}
                            className="text-zinc-500 hover:text-white transition-colors"
                            title="Copiar senha"
                        >
                            {copiandoSenha
                                ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                : <Copy className="w-3.5 h-3.5" />
                            }
                        </button>
                    </div>
                </div>
            </div>

            {(badge || item.notas) && (
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                    {badge && (
                        <span className="text-[10px] font-bold text-zinc-500 bg-zinc-800/60 px-2.5 py-1 rounded-full">
                            {badge}
                        </span>
                    )}
                    {item.notas && (
                        <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                            <StickyNote className="w-3 h-3" />
                            {item.notas.length > 40 ? item.notas.slice(0, 40) + '…' : item.notas}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

const FORM_VAZIO = {
    nome: '',
    url: '',
    usuario: '',
    senha: '',
    categoria: '',
    notas: '',
    cor: '#059669',
};

export default function GestaoSenhas() {
    const [senhas, setSenhas] = useState<Senha[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [busca, setBusca] = useState('');
    const [filtroCategoria, setFiltroCategoria] = useState('');
    const [sheetAberto, setSheetAberto] = useState(false);
    const [senhaParaEditar, setSenhaParaEditar] = useState<Senha | null>(null);
    const [revelarFormSenha, setRevelarFormSenha] = useState(false);
    const [form, setForm] = useState(FORM_VAZIO);
    const [migrated, setMigrated] = useState(false);

    const garantirTabela = useCallback(async () => {
        if (migrated) return;
        await fetch('/api/senhas/migrate');
        setMigrated(true);
    }, [migrated]);

    const buscarSenhas = useCallback(async () => {
        setCarregando(true);
        try {
            const res = await fetch('/api/senhas');
            if (res.ok) {
                const json = await res.json();
                setSenhas(json.data || []);
            }
        } catch {
            toast.error('Erro ao carregar senhas.');
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => {
        garantirTabela().then(() => buscarSenhas());
    }, [garantirTabela, buscarSenhas]);

    const abrirNova = () => {
        setSenhaParaEditar(null);
        setForm(FORM_VAZIO);
        setRevelarFormSenha(false);
        setSheetAberto(true);
    };

    const abrirEditar = (s: Senha) => {
        setSenhaParaEditar(s);
        setForm({
            nome: s.nome,
            url: s.url || '',
            usuario: s.usuario,
            senha: s.senha,
            categoria: s.categoria || '',
            notas: s.notas || '',
            cor: s.cor,
        });
        setRevelarFormSenha(false);
        setSheetAberto(true);
    };

    const excluir = async (id: string) => {
        if (!confirm('Excluir esta senha? Esta ação não pode ser desfeita.')) return;
        const t = toast.loading('Excluindo...');
        try {
            const res = await fetch(`/api/senhas/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            setSenhas(prev => prev.filter(s => s.id !== id));
            toast.success('Senha excluída.', { id: t });
        } catch {
            toast.error('Erro ao excluir.', { id: t });
        }
    };

    const salvar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.nome || !form.usuario || !form.senha) {
            toast.error('Nome, usuário e senha são obrigatórios.');
            return;
        }
        setSalvando(true);
        const t = toast.loading(senhaParaEditar ? 'Atualizando...' : 'Salvando...');
        try {
            const url = senhaParaEditar ? `/api/senhas/${senhaParaEditar.id}` : '/api/senhas';
            const method = senhaParaEditar ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (!res.ok) throw new Error();
            const json = await res.json();
            if (senhaParaEditar) {
                setSenhas(prev => prev.map(s => s.id === senhaParaEditar.id ? json.data : s));
                toast.success('Senha atualizada!', { id: t });
            } else {
                setSenhas(prev => [...prev, json.data].sort((a, b) => a.nome.localeCompare(b.nome)));
                toast.success('Senha salva!', { id: t });
            }
            setSheetAberto(false);
        } catch {
            toast.error('Erro ao salvar.', { id: t });
        } finally {
            setSalvando(false);
        }
    };

    const senhasFiltradas = senhas.filter(s => {
        const matchBusca = !busca ||
            s.nome.toLowerCase().includes(busca.toLowerCase()) ||
            s.usuario.toLowerCase().includes(busca.toLowerCase()) ||
            (s.url || '').toLowerCase().includes(busca.toLowerCase());
        const matchCategoria = !filtroCategoria || s.categoria === filtroCategoria;
        return matchBusca && matchCategoria;
    });

    return (
        <div className="space-y-6">
            {/* Header de ações */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                    <Input
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                        placeholder="Buscar por nome, usuário ou URL..."
                        className="pl-10 bg-zinc-900/50 border-zinc-800 text-white h-11 rounded-xl focus:border-emerald-500/50 placeholder:text-zinc-600"
                    />
                </div>
                <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                    <SelectTrigger className="bg-zinc-900/50 border-zinc-800 text-white h-11 rounded-xl w-full sm:w-48">
                        <SelectValue placeholder="Todas categorias" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 rounded-xl">
                        <SelectItem value="" className="text-zinc-300 focus:bg-zinc-800 focus:text-white rounded-lg">Todas</SelectItem>
                        {CATEGORIAS.map(c => (
                            <SelectItem key={c.valor} value={c.valor} className="text-zinc-300 focus:bg-zinc-800 focus:text-white rounded-lg">
                                {c.emoji} {c.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button
                    onClick={abrirNova}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white h-11 rounded-xl px-5 font-bold gap-2 flex-shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    Nova Senha
                </Button>
            </div>

            {/* Contador */}
            {!carregando && senhas.length > 0 && (
                <p className="text-xs text-zinc-600 font-medium">
                    {senhasFiltradas.length === senhas.length
                        ? `${senhas.length} senha${senhas.length !== 1 ? 's' : ''} salva${senhas.length !== 1 ? 's' : ''}`
                        : `${senhasFiltradas.length} de ${senhas.length} senha${senhas.length !== 1 ? 's' : ''}`
                    }
                </p>
            )}

            {/* Lista */}
            {carregando ? (
                <div className="flex items-center justify-center py-20 text-zinc-600">
                    <Loader2 className="w-6 h-6 animate-spin mr-3" />
                    <span className="text-sm font-medium">Carregando senhas...</span>
                </div>
            ) : senhas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                        <KeyRound className="w-8 h-8 text-emerald-500/50" />
                    </div>
                    <p className="text-zinc-400 font-bold text-sm">Nenhuma senha salva</p>
                    <p className="text-zinc-600 text-xs mt-1 max-w-xs">
                        Adicione suas senhas para nunca mais esquecer logins de apps e sites.
                    </p>
                    <Button onClick={abrirNova} className="mt-5 bg-emerald-600 hover:bg-emerald-500 text-white h-10 rounded-xl px-5 font-bold gap-2 text-sm">
                        <Plus className="w-4 h-4" />
                        Adicionar Primeira Senha
                    </Button>
                </div>
            ) : senhasFiltradas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <AlertCircle className="w-8 h-8 text-zinc-600 mb-3" />
                    <p className="text-zinc-500 text-sm font-medium">Nenhum resultado encontrado</p>
                    <p className="text-zinc-600 text-xs mt-1">Tente ajustar o filtro ou a busca.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {senhasFiltradas.map(s => (
                        <SenhaCard
                            key={s.id}
                            item={s}
                            onEditar={abrirEditar}
                            onExcluir={excluir}
                        />
                    ))}
                </div>
            )}

            {/* Sheet de cadastro/edição */}
            <Sheet open={sheetAberto} onOpenChange={setSheetAberto}>
                <SheetContent side="right" className="bg-zinc-950 border-zinc-800/50 w-full sm:max-w-md p-0 flex flex-col shadow-2xl">
                    <SheetHeader className="p-8 pb-4 space-y-4 shrink-0">
                        <div className="flex items-center justify-between">
                            <SheetTitle className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                    {senhaParaEditar ? <PenTool className="w-6 h-6" /> : <KeyRound className="w-6 h-6" />}
                                </div>
                                {senhaParaEditar ? 'Editar Senha' : 'Nova Senha'}
                            </SheetTitle>
                        </div>
                        <SheetDescription className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-[10px] ml-1">
                            {senhaParaEditar ? 'Atualize as informações salvas' : 'Preencha os dados do login'}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto px-8 pb-24 scroll-container">
                        <form onSubmit={salvar} id="senha-form" className="space-y-5 mt-4">
                            {/* Nome */}
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">
                                    Nome / Serviço *
                                </Label>
                                <Input
                                    value={form.nome}
                                    onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                                    placeholder="Ex: Gmail, Instagram, Nubank..."
                                    required
                                    className="bg-zinc-900/50 border-zinc-800 text-white font-bold h-14 rounded-2xl focus:border-emerald-500/50 transition-all placeholder:text-zinc-700"
                                />
                            </div>

                            {/* URL */}
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1 flex items-center gap-1.5">
                                    <Globe className="w-3 h-3" /> URL do site
                                </Label>
                                <Input
                                    value={form.url}
                                    onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                                    placeholder="https://exemplo.com"
                                    className="bg-zinc-900/50 border-zinc-800 text-white font-bold h-14 rounded-2xl focus:border-emerald-500/50 transition-all placeholder:text-zinc-700"
                                />
                            </div>

                            {/* Usuário */}
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1 flex items-center gap-1.5">
                                    <User className="w-3 h-3" /> Usuário / E-mail *
                                </Label>
                                <Input
                                    value={form.usuario}
                                    onChange={e => setForm(f => ({ ...f, usuario: e.target.value }))}
                                    placeholder="seu@email.com ou @usuario"
                                    required
                                    className="bg-zinc-900/50 border-zinc-800 text-white font-bold h-14 rounded-2xl focus:border-emerald-500/50 transition-all placeholder:text-zinc-700"
                                />
                            </div>

                            {/* Senha */}
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1 flex items-center gap-1.5">
                                    <Lock className="w-3 h-3" /> Senha *
                                </Label>
                                <div className="relative">
                                    <Input
                                        type={revelarFormSenha ? 'text' : 'password'}
                                        value={form.senha}
                                        onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
                                        placeholder="Digite a senha"
                                        required
                                        className="bg-zinc-900/50 border-zinc-800 text-white font-bold h-14 rounded-2xl focus:border-emerald-500/50 transition-all placeholder:text-zinc-700 pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setRevelarFormSenha(v => !v)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                                    >
                                        {revelarFormSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Categoria */}
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1 flex items-center gap-1.5">
                                    <Tag className="w-3 h-3" /> Categoria
                                </Label>
                                <Select value={form.categoria} onValueChange={v => setForm(f => ({ ...f, categoria: v }))}>
                                    <SelectTrigger className="bg-zinc-900/50 border-zinc-800 text-white font-bold h-14 rounded-2xl focus:ring-emerald-500/20">
                                        <SelectValue placeholder="Selecione uma categoria" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800 rounded-2xl">
                                        {CATEGORIAS.map(c => (
                                            <SelectItem key={c.valor} value={c.valor} className="text-sm font-bold text-zinc-300 focus:bg-zinc-800 focus:text-white rounded-lg">
                                                {c.emoji} {c.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Cor */}
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">
                                    Cor de identificação
                                </Label>
                                <div className="flex gap-2 flex-wrap">
                                    {CORES.map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, cor: c }))}
                                            className="w-8 h-8 rounded-xl transition-all hover:scale-110"
                                            style={{
                                                backgroundColor: c,
                                                outline: form.cor === c ? `2px solid ${c}` : '2px solid transparent',
                                                outlineOffset: '2px',
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Notas */}
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1 flex items-center gap-1.5">
                                    <StickyNote className="w-3 h-3" /> Notas
                                </Label>
                                <textarea
                                    value={form.notas}
                                    onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                                    placeholder="Observações adicionais..."
                                    rows={3}
                                    className="w-full bg-zinc-900/50 border border-zinc-800 text-white font-bold rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-zinc-700 resize-none"
                                />
                            </div>
                        </form>
                    </div>

                    <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent pt-12 shrink-0">
                        <div className="flex gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setSheetAberto(false)}
                                disabled={salvando}
                                className="flex-1 border-zinc-800 hover:bg-zinc-900 text-zinc-400 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all"
                            >
                                Cancelar
                            </Button>
                            <Button
                                form="senha-form"
                                type="submit"
                                disabled={salvando}
                                className={`flex-[2] h-14 text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all ${senhaParaEditar ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-500'}`}
                            >
                                {salvando
                                    ? <Loader2 className="w-5 h-5 animate-spin" />
                                    : senhaParaEditar ? 'Salvar Alterações' : 'Salvar Senha'
                                }
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
