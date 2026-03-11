'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/dexie';
import {
  Plus,
  Plane,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  Globe,
  Sparkles,
  TrendingUp,
  Briefcase,
  GraduationCap,
  Heart,
  Crown,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { Viagem, StatusViagem, PropostoViagem } from '@/types/viagem';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/ui/PageHeader';

const statusColors = {
  PLANEJADA: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  EM_ANDAMENTO: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
  CONCLUIDA: { bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/20' },
  CANCELADA: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
};

const statusLabels = {
  PLANEJADA: 'Planejada',
  EM_ANDAMENTO: 'Em Andamento',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

const propostoIcons = {
  LAZER: Heart,
  TRABALHO: Briefcase,
  ESTUDO: GraduationCap,
  OUTRO: Globe,
};

const propostoLabels = {
  LAZER: 'Lazer',
  TRABALHO: 'Trabalho',
  ESTUDO: 'Estudo',
  OUTRO: 'Outro',
};

interface ViagemComDetalhes extends Viagem {
  totalGasto: number;
  diasRestantes: number;
}

export default function ViagensPage() {
  const router = useRouter();
  const [viagens, setViagens] = useState<ViagemComDetalhes[]>([]);
  const [filteredViagens, setFilteredViagens] = useState<ViagemComDetalhes[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    proposito: 'LAZER' as PropostoViagem,
    dataInicio: '',
    dataFim: '',
    orcamentoTotal: '',
    notasGerais: '',
  });

  useEffect(() => {
    checkPremiumStatus();
  }, []);

  useEffect(() => {
    if (isPremium) {
      fetchViagens();
    }
  }, [isPremium]);

  useEffect(() => {
    filterViagens();
  }, [searchTerm, statusFilter, viagens]);

  const checkPremiumStatus = async () => {
    try {
      const response = await fetch('/api/v1/planos');
      if (response.ok) {
        const data = await response.json();
        setIsPremium(data.plano === 'PREMIUM' && data.ativo);
      }
    } catch (error) {
      console.error('Erro ao verificar plano:', error);
    }
  };

  const fetchViagens = async () => {
    try {
      setLoading(true);

      const userId = localStorage.getItem('offline_user_id') || 'local_user';
      const user = await db.users.get(userId);

      if (!user || user.plano !== 'PREMIUM') {
        setIsPremium(false);
        return;
      }

      setIsPremium(true);
      const viagensDb = await db.viagens.toArray();
      const despesasDb = await db.despesasViagem.toArray();
      const destinosDb = await db.destinosViagem.toArray();

      const viagensComDetalhes = viagensDb.map(v => {
        const despesasViagem = despesasDb.filter(d => d.viagemId === v.id);
        const destinosViagem = destinosDb.filter(d => d.viagemId === v.id).sort((a, b) => a.ordem - b.ordem);

        const totalGasto = despesasViagem.reduce((acc, d) => acc + d.valor, 0);

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const dataIn = new Date(v.dataInicio);
        dataIn.setHours(0, 0, 0, 0);

        const diffMs = dataIn.getTime() - hoje.getTime();
        const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        return {
          ...v,
          destinos: destinosViagem,
          totalGasto,
          diasRestantes
        } as ViagemComDetalhes;
      });

      // Ordenar: primeiro as ativas (Planejada, Em andamento), depois as proximas, depois as antigas
      viagensComDetalhes.sort((a, b) => {
        if (a.status === 'EM_ANDAMENTO' && b.status !== 'EM_ANDAMENTO') return -1;
        if (a.status !== 'EM_ANDAMENTO' && b.status === 'EM_ANDAMENTO') return 1;

        return new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime();
      });

      setViagens(viagensComDetalhes);

    } catch (error) {
      console.error('Erro ao buscar viagens:', error);
      toast.error('Erro ao carregar viagens');
    } finally {
      setLoading(false);
    }
  };

  const filterViagens = () => {
    let filtered = viagens;

    if (searchTerm) {
      filtered = filtered.filter(
        (viagem) =>
          viagem.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          viagem.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((viagem) => viagem.status === statusFilter);
    }

    setFilteredViagens(filtered);
  };

  const handleCreateViagem = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const novaViagemId = crypto.randomUUID();
      await db.viagens.add({
        id: novaViagemId,
        nome: formData.nome,
        descricao: formData.descricao || undefined,
        proposito: formData.proposito,
        status: 'PLANEJADA',
        dataInicio: new Date(formData.dataInicio),
        dataFim: new Date(formData.dataFim),
        orcamentoTotal: formData.orcamentoTotal ? Number(formData.orcamentoTotal) : undefined,
        notasGerais: formData.notasGerais || undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      toast.success('Viagem criada com sucesso!');
      setIsModalOpen(false);
      resetForm();
      fetchViagens();
    } catch (error) {
      console.error('Erro ao criar viagem:', error);
      toast.error('Erro ao criar viagem');
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      proposito: 'LAZER' as PropostoViagem,
      dataInicio: '',
      dataFim: '',
      orcamentoTotal: '',
      notasGerais: '',
    });
  };

  const getCountdownText = (diasRestantes: number, status: StatusViagem) => {
    if (status === 'CONCLUIDA' || status === 'CANCELADA') return null;
    if (status === 'EM_ANDAMENTO') return 'Em andamento agora';
    if (diasRestantes === 0) return 'Viagem começa hoje!';
    if (diasRestantes === 1) return 'Falta 1 dia';
    return `Faltam ${diasRestantes} dias`;
  };

  // Estatísticas
  const viagensAtivas = viagens.filter(v => v.status === 'PLANEJADA' || v.status === 'EM_ANDAMENTO');
  const totalGasto = viagens.reduce((acc, v) => acc + v.totalGasto, 0);
  const proximaViagem = viagensAtivas.find(v => v.diasRestantes >= 0 && v.status === 'PLANEJADA');

  if (!isPremium) {
    return (
      <div className="bg-zinc-950 min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full p-8 bg-gradient-to-br from-zenit-500/10 to-blue-500/10 border-zenit-500/20">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-gradient-to-br from-zenit-500 to-blue-500 rounded-full">
                <Crown className="w-12 h-12 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Recurso Premium</h2>
              <p className="text-zinc-400 text-lg">
                O gerenciamento de viagens está disponível apenas para usuários Premium
              </p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 space-y-3 text-left">
              <h3 className="font-semibold text-lg mb-4 text-white">Com o plano Premium você terá:</h3>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-zenit-400 mt-0.5 flex-shrink-0" />
                  <span className="text-zinc-300">Planejamento completo de viagens com múltiplos destinos</span>
                </div>
                <div className="flex items-start gap-3">
                  <Plane className="w-5 h-5 text-zenit-400 mt-0.5 flex-shrink-0" />
                  <span className="text-zinc-300">Gerenciamento de transportes, voos e hospedagens</span>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-zenit-400 mt-0.5 flex-shrink-0" />
                  <span className="text-zinc-300">Roteiro detalhado com atividades dia a dia</span>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-zenit-400 mt-0.5 flex-shrink-0" />
                  <span className="text-zinc-300">Controle financeiro completo com conversão de moedas</span>
                </div>
              </div>
            </div>
            <Button
              onClick={() => router.push('/premium')}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-6 text-lg"
            >
              <Crown className="w-5 h-5 mr-2" />
              Fazer Upgrade para Premium
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Plane className="w-10 h-10 text-emerald-500 animate-bounce mx-auto mb-4" />
          <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest animate-pulse">Carregando viagens...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 overflow-hidden">
      {/* Header */}
      <PageHeader 
        title="Minhas Viagens"
        description="Planeje e gerencie suas aventuras"
        action={
          <Button
            onClick={() => setIsModalOpen(true)}
            variant="premium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Viagem
          </Button>
        }
      />

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border border-zinc-800/50 bg-zinc-900/40">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Sparkles className="w-5 h-5 text-emerald-500" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Viagens Ativas</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {viagensAtivas.length}
              </div>
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-tight">
                {viagens.length - viagensAtivas.length} concluídas ou canceladas
              </p>
            </div>
          </Card>

          <Card className="border border-zinc-800/50 bg-zinc-900/40">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <DollarSign className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Total Investido</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                R$ {totalGasto.toFixed(2)}
              </div>
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-tight">Em todas as viagens</p>
            </div>
          </Card>

          <Card className="border border-zinc-800/50 bg-zinc-900/40">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-pink-500/10 rounded-lg">
                  <Clock className="w-5 h-5 text-pink-400" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Próxima Viagem</span>
              </div>
              {proximaViagem ? (
                <>
                  <div className="text-xl font-bold text-white mb-1 truncate">
                    {proximaViagem.nome}
                  </div>
                  <p className="text-[10px] font-bold text-pink-500 uppercase tracking-tight">
                    {getCountdownText(proximaViagem.diasRestantes, proximaViagem.status)}
                  </p>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-zinc-700 mb-1">—</div>
                  <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-tight">Nenhuma planejada</p>
                </>
              )}
            </div>
          </Card>
        </div>

      {/* Filtros */}
      <Card className="p-4 border border-zinc-800/50 bg-zinc-900/40">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" />
            <Input
              placeholder="Buscar viagens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48 bg-zinc-800 border-zinc-700 text-white">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os Status</SelectItem>
              <SelectItem value="PLANEJADA">Planejada</SelectItem>
              <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
              <SelectItem value="CONCLUIDA">Concluída</SelectItem>
              <SelectItem value="CANCELADA">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Lista de Viagens */}
      {filteredViagens.length === 0 ? (
        <Card className="bg-zinc-900/50 border-zinc-800 p-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-zenit-500/10 rounded-full mb-4">
              <Plane className="w-10 h-10 text-zenit-400" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-2">
              {viagens.length === 0 ? 'Comece a planejar suas aventuras!' : 'Nenhuma viagem encontrada'}
            </h3>
            <p className="text-zinc-400 mb-6 max-w-md mx-auto">
              {viagens.length === 0
                ? 'Crie sua primeira viagem e comece a organizar todos os detalhes da sua próxima aventura'
                : 'Nenhuma viagem corresponde aos filtros aplicados.'}
            </p>
            {viagens.length === 0 && (
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Viagem
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredViagens.map((viagem) => {
            const countdownText = getCountdownText(viagem.diasRestantes, viagem.status);
            const percentGasto = viagem.orcamentoTotal
              ? (viagem.totalGasto / Number(viagem.orcamentoTotal)) * 100
              : 0;
            const PropostoIcon = propostoIcons[viagem.proposito];

            return (
              <Card
                key={viagem.id}
                className="relative overflow-hidden bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all group hover:shadow-lg cursor-pointer"
                onClick={() => router.push(`/dashboard/viagens/${viagem.id}`)}
              >
                {/* Barra de status no topo */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 ${viagem.status === 'PLANEJADA' ? 'bg-blue-500' :
                    viagem.status === 'EM_ANDAMENTO' ? 'bg-green-500' :
                      viagem.status === 'CONCLUIDA' ? 'bg-zinc-500' : 'bg-red-500'
                    }`}
                />

                <div className="relative p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-3 bg-zenit-500/10 rounded-xl">
                        <PropostoIcon className="w-6 h-6 text-zenit-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-white group-hover:text-zenit-400 transition-colors truncate">
                          {viagem.nome}
                        </h3>
                        {viagem.descricao && (
                          <p className="text-sm text-zinc-400 line-clamp-1">{viagem.descricao}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge className={`${statusColors[viagem.status].bg} ${statusColors[viagem.status].text} border ${statusColors[viagem.status].border}`}>
                      {statusLabels[viagem.status]}
                    </Badge>
                    <Badge className="bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {propostoLabels[viagem.proposito]}
                    </Badge>
                  </div>

                  {/* Informações */}
                  <div className="space-y-3 mb-4">
                    {/* Datas */}
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>
                        {format(new Date(viagem.dataInicio), 'dd MMM', { locale: ptBR })} -{' '}
                        {format(new Date(viagem.dataFim), 'dd MMM yyyy', { locale: ptBR })}
                      </span>
                    </div>

                    {/* Countdown */}
                    {countdownText && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-zenit-400 flex-shrink-0" />
                        <span className="text-zenit-400 font-medium">{countdownText}</span>
                      </div>
                    )}

                    {/* Destinos */}
                    {viagem.destinos && viagem.destinos.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span>{viagem.destinos.length} {viagem.destinos.length === 1 ? 'destino' : 'destinos'}</span>
                      </div>
                    )}
                  </div>

                  {/* Orçamento */}
                  {viagem.orcamentoTotal && (
                    <div className="pt-4 border-t border-zinc-800">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-zinc-400">Orçamento</span>
                        <span className="font-medium text-white">
                          R$ {viagem.totalGasto.toFixed(2)} / R$ {Number(viagem.orcamentoTotal).toFixed(2)}
                        </span>
                      </div>
                      <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`absolute inset-y-0 left-0 rounded-full transition-all ${percentGasto > 100
                            ? 'bg-red-500'
                            : percentGasto > 80
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                            }`}
                          style={{ width: `${Math.min(percentGasto, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">
                        {percentGasto > 100
                          ? `${(percentGasto - 100).toFixed(0)}% acima do orçamento`
                          : `${(100 - percentGasto).toFixed(0)}% restante`}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Criação */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">Nova Viagem</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Crie uma nova viagem e comece a planejar sua aventura
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateViagem} className="space-y-4">
            <div>
              <Label htmlFor="nome" className="text-white">Nome da Viagem *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Viagem para Paris"
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>

            <div>
              <Label htmlFor="descricao" className="text-white">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descreva sua viagem..."
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="proposito" className="text-white">Propósito</Label>
                <Select
                  value={formData.proposito}
                  onValueChange={(value) =>
                    setFormData({ ...formData, proposito: value as PropostoViagem })
                  }
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LAZER">Lazer</SelectItem>
                    <SelectItem value="TRABALHO">Trabalho</SelectItem>
                    <SelectItem value="ESTUDO">Estudo</SelectItem>
                    <SelectItem value="OUTRO">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="orcamento" className="text-white">Orçamento Total</Label>
                <Input
                  id="orcamento"
                  type="number"
                  step="0.01"
                  value={formData.orcamentoTotal}
                  onChange={(e) =>
                    setFormData({ ...formData, orcamentoTotal: e.target.value })
                  }
                  placeholder="0.00"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dataInicio" className="text-white">Data de Início *</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={formData.dataInicio}
                  onChange={(e) =>
                    setFormData({ ...formData, dataInicio: e.target.value })
                  }
                  required
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              <div>
                <Label htmlFor="dataFim" className="text-white">Data de Término *</Label>
                <Input
                  id="dataFim"
                  type="date"
                  value={formData.dataFim}
                  onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })}
                  required
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notas" className="text-white">Notas Gerais</Label>
              <Textarea
                id="notas"
                value={formData.notasGerais}
                onChange={(e) => setFormData({ ...formData, notasGerais: e.target.value })}
                placeholder="Adicione notas ou observações sobre a viagem..."
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="bg-zinc-800 hover:bg-zinc-700 text-white"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700"
              >
                Criar Viagem
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
