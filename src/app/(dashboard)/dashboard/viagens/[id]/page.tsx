'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/lib/dexie';
import {
  ArrowLeft,
  MapPin,
  Plane,
  Hotel,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  Plus,
  Globe,
  Clock,
  Zap,
} from 'lucide-react';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ViagemComDetalhes, DestinoViagem, CreateDestinoDTO } from '@/types/viagem';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

export default function ViagemDetalhesPage() {
  const router = useRouter();
  const params = useParams();
  const [viagem, setViagem] = useState<ViagemComDetalhes | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDestinoModalOpen, setIsDestinoModalOpen] = useState(false);
  const [destinoFormData, setDestinoFormData] = useState({
    nome: '',
    cidade: '',
    pais: '',
    dataChegada: '',
    dataSaida: '',
    endereco: '',
    fusoHorario: '',
    idioma: '',
    moeda: '',
    voltagem: '',
    tomada: '',
    temperaturaMed: '',
    emergencia: '',
  });

  useEffect(() => {
    fetchViagem();
  }, [params.id]);

  const fetchViagem = async () => {
    try {
      setLoading(true);

      const resolvedParams = await params;
      const viagemIdParam = Array.isArray(resolvedParams.id) ? resolvedParams.id[0] : resolvedParams.id;
      const viagemId = viagemIdParam || '';

      const v = await db.viagens.get(viagemId);

      if (!v) {
        toast.error('Viagem não encontrada');
        router.push('/dashboard/viagens');
        return;
      }

      const despesasViagem = await db.despesasViagem.where('viagemId').equals(viagemId).toArray();
      const destinosViagem = await db.destinosViagem.where('viagemId').equals(viagemId).toArray();

      const totalGasto = despesasViagem.reduce((acc, d) => acc + d.valor, 0);

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const dataIn = new Date(v.dataInicio);
      dataIn.setHours(0, 0, 0, 0);

      const diffMs = dataIn.getTime() - hoje.getTime();
      const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      setViagem({
        ...v,
        destinos: destinosViagem.sort((a, b) => a.ordem - b.ordem),
        totalGasto,
        diasRestantes
      } as ViagemComDetalhes);

    } catch (error) {
      console.error('Erro ao buscar viagem:', error);
      toast.error('Erro ao carregar viagem');
      router.push('/dashboard/viagens');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta viagem?')) return;

    try {
      const resolvedParams = await params;
      const viagemIdParam = Array.isArray(resolvedParams.id) ? resolvedParams.id[0] : resolvedParams.id;
      const viagemId = viagemIdParam || '';

      await db.viagens.delete(viagemId);

      // Cascading delete
      const destinos = await db.destinosViagem.where('viagemId').equals(viagemId).toArray();
      await db.destinosViagem.bulkDelete(destinos.map(d => d.id));

      const despesas = await db.despesasViagem.where('viagemId').equals(viagemId).toArray();
      await db.despesasViagem.bulkDelete(despesas.map(d => d.id));

      toast.success('Viagem excluída com sucesso!');
      router.push('/dashboard/viagens');
    } catch (error) {
      console.error('Erro ao excluir viagem:', error);
      toast.error('Erro ao excluir viagem');
    }
  };

  const handleCreateDestino = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const resolvedParams = await params;
      const viagemIdParam = Array.isArray(resolvedParams.id) ? resolvedParams.id[0] : resolvedParams.id;
      const viagemId = viagemIdParam || '';
      const novoDestinoId = crypto.randomUUID();

      await db.destinosViagem.add({
        id: novoDestinoId,
        ordem: viagem?.destinos?.length || 0,
        nome: destinoFormData.nome,
        cidade: destinoFormData.cidade,
        pais: destinoFormData.pais,
        dataChegada: new Date(destinoFormData.dataChegada),
        dataSaida: new Date(destinoFormData.dataSaida),
        endereco: destinoFormData.endereco || undefined,
        fusoHorario: destinoFormData.fusoHorario || undefined,
        idioma: destinoFormData.idioma || undefined,
        moeda: destinoFormData.moeda || undefined,
        voltagem: destinoFormData.voltagem || undefined,
        tomada: destinoFormData.tomada || undefined,
        temperaturaMed: destinoFormData.temperaturaMed || undefined,
        emergencia: destinoFormData.emergencia || undefined,
        viagemId: viagemId,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      toast.success('Destino adicionado com sucesso!');
      setIsDestinoModalOpen(false);
      resetDestinoForm();
      fetchViagem();
    } catch (error) {
      console.error('Erro ao criar destino:', error);
      toast.error('Erro ao adicionar destino');
    }
  };

  const handleDeleteDestino = async (destinoId: string) => {
    if (!confirm('Tem certeza que deseja remover este destino?')) return;

    try {
      await db.destinosViagem.delete(destinoId);
      toast.success('Destino removido com sucesso!');
      fetchViagem();
    } catch (error) {
      console.error('Erro ao remover destino:', error);
      toast.error('Erro ao remover destino');
    }
  };

  const resetDestinoForm = () => {
    setDestinoFormData({
      nome: '',
      cidade: '',
      pais: '',
      dataChegada: '',
      dataSaida: '',
      endereco: '',
      fusoHorario: '',
      idioma: '',
      moeda: '',
      voltagem: '',
      tomada: '',
      temperaturaMed: '',
      emergencia: '',
    });
  };

  if (loading) {
    return (
      <LoadingScreen message="Carregando detalhes da viagem..." />
    );
  }

  if (!viagem) {
    return null;
  }

  const percentGasto = viagem.orcamentoTotal
    ? (viagem.totalGasto / Number(viagem.orcamentoTotal)) * 100
    : 0;

  return (
    <div className="bg-zinc-950 p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            size="icon"
            onClick={() => router.push('/dashboard/viagens')}
            className="bg-zinc-800 hover:bg-zinc-700 text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{viagem.nome}</h1>
            {viagem.descricao && (
              <p className="text-zinc-400">{viagem.descricao}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="icon"
            className="bg-zinc-800 hover:bg-zinc-700 text-white"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            onClick={handleDelete}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Status e Informações Básicas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900/50 border-zinc-800 p-6">
          <div className="text-center">
            <p className="text-sm text-zinc-400 mb-2">Status</p>
            <Badge className={`${statusColors[viagem.status].bg} ${statusColors[viagem.status].text} border ${statusColors[viagem.status].border}`}>
              {statusLabels[viagem.status]}
            </Badge>
          </div>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800 p-6">
          <div className="text-center">
            <p className="text-sm text-zinc-400 mb-2">Período</p>
            <p className="text-lg font-bold text-white">
              {format(new Date(viagem.dataInicio), 'dd MMM', { locale: ptBR })} -{' '}
              {format(new Date(viagem.dataFim), 'dd MMM yyyy', { locale: ptBR })}
            </p>
          </div>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800 p-6">
          <div className="text-center">
            <p className="text-sm text-zinc-400 mb-2">Destinos</p>
            <p className="text-lg font-bold text-white">
              {viagem.destinos?.length || 0}
            </p>
          </div>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800 p-6">
          <div className="text-center">
            <p className="text-sm text-zinc-400 mb-2">Orçamento</p>
            <p className="text-lg font-bold text-white">
              {viagem.orcamentoTotal
                ? `R$ ${Number(viagem.orcamentoTotal).toFixed(2)}`
                : 'Não definido'}
            </p>
          </div>
        </Card>
      </div>

      {/* Orçamento Detalhado */}
      {viagem.orcamentoTotal && (
        <Card className="bg-zinc-900/50 border-zinc-800 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Controle de Orçamento</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Total Gasto</span>
              <span className="text-2xl font-bold text-white">
                R$ {viagem.totalGasto.toFixed(2)}
              </span>
            </div>
            <div className="relative h-4 bg-zinc-800 rounded-full overflow-hidden">
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
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">
                {percentGasto.toFixed(1)}% utilizado
              </span>
              <span className="text-zinc-400">
                R$ {(Number(viagem.orcamentoTotal) - viagem.totalGasto).toFixed(2)} restante
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Tabs com Conteúdo */}
      <Tabs defaultValue="destinos" className="space-y-4">
        <TabsList className="bg-zinc-900/50 border border-zinc-800">
          <TabsTrigger value="destinos" className="data-[state=active]:bg-zenit-500 data-[state=active]:text-white">
            <MapPin className="w-4 h-4 mr-2" />
            Destinos
          </TabsTrigger>
          <TabsTrigger value="transportes" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            <Plane className="w-4 h-4 mr-2" />
            Transportes
          </TabsTrigger>
          <TabsTrigger value="hospedagens" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
            <Hotel className="w-4 h-4 mr-2" />
            Hospedagens
          </TabsTrigger>
          <TabsTrigger value="atividades" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
            <Calendar className="w-4 h-4 mr-2" />
            Atividades
          </TabsTrigger>
        </TabsList>

        {/* Tab de Destinos */}
        <TabsContent value="destinos" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Destinos da Viagem</h2>
            <Button
              onClick={() => setIsDestinoModalOpen(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Destino
            </Button>
          </div>

          {!viagem.destinos || viagem.destinos.length === 0 ? (
            <Card className="bg-zinc-900/50 border-zinc-800 p-12">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-zenit-500/10 rounded-full mb-4">
                  <MapPin className="w-8 h-8 text-zenit-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Nenhum destino adicionado
                </h3>
                <p className="text-zinc-400 mb-6">
                  Comece adicionando os destinos da sua viagem
                </p>
                <Button
                  onClick={() => setIsDestinoModalOpen(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Primeiro Destino
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {viagem.destinos.map((destino: any) => (
                <Card
                  key={destino.id}
                  className="bg-zinc-900/50 border-zinc-800 hover:border-zenit-500/40 transition-all p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-zenit-500/10 rounded-xl">
                        <MapPin className="w-6 h-6 text-zenit-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{destino.nome}</h3>
                        <p className="text-sm text-zinc-400">{destino.cidade}, {destino.pais}</p>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      onClick={() => handleDeleteDestino(destino.id)}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-zinc-500" />
                      <span className="text-zinc-400">
                        {format(new Date(destino.dataChegada), 'dd MMM', { locale: ptBR })} -{' '}
                        {format(new Date(destino.dataSaida), 'dd MMM yyyy', { locale: ptBR })}
                      </span>
                    </div>

                    {destino.endereco && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-zinc-500 mt-0.5 flex-shrink-0" />
                        <span className="text-zinc-400">{destino.endereco}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-zinc-800">
                      {destino.idioma && (
                        <div>
                          <p className="text-xs text-zinc-500">Idioma</p>
                          <p className="text-sm text-white font-medium">{destino.idioma}</p>
                        </div>
                      )}
                      {destino.moeda && (
                        <div>
                          <p className="text-xs text-zinc-500">Moeda</p>
                          <p className="text-sm text-white font-medium">{destino.moeda}</p>
                        </div>
                      )}
                      {destino.fusoHorario && (
                        <div>
                          <p className="text-xs text-zinc-500">Fuso Horário</p>
                          <p className="text-sm text-white font-medium">{destino.fusoHorario}</p>
                        </div>
                      )}
                      {destino.temperaturaMed && (
                        <div>
                          <p className="text-xs text-zinc-500">Temperatura</p>
                          <p className="text-sm text-white font-medium">{destino.temperaturaMed}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Outras Tabs - Em breve */}
        <TabsContent value="transportes">
          <Card className="bg-zinc-900/50 border-zinc-800 p-12">
            <div className="text-center">
              <Plane className="w-16 h-16 mx-auto text-blue-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Transportes - Em breve
              </h3>
              <p className="text-zinc-400">
                Gerenciamento de transportes será adicionado em breve
              </p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="hospedagens">
          <Card className="bg-zinc-900/50 border-zinc-800 p-12">
            <div className="text-center">
              <Hotel className="w-16 h-16 mx-auto text-green-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Hospedagens - Em breve
              </h3>
              <p className="text-zinc-400">
                Gerenciamento de hospedagens será adicionado em breve
              </p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="atividades">
          <Card className="bg-zinc-900/50 border-zinc-800 p-12">
            <div className="text-center">
              <Calendar className="w-16 h-16 mx-auto text-green-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Atividades - Em breve
              </h3>
              <p className="text-zinc-400">
                Gerenciamento de atividades será adicionado em breve
              </p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Notas Gerais */}
      {viagem.notasGerais && (
        <Card className="bg-zinc-900/50 border-zinc-800 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Notas Gerais</h2>
          <p className="text-zinc-400 whitespace-pre-wrap">{viagem.notasGerais}</p>
        </Card>
      )}

      {/* Modal de Adicionar Destino */}
      <Dialog open={isDestinoModalOpen} onOpenChange={setIsDestinoModalOpen}>
        <DialogContent className="max-w-3xl bg-zinc-900 border-zinc-800 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Adicionar Destino</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Adicione um novo destino à sua viagem
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateDestino} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome" className="text-white">Nome do Destino *</Label>
                <Input
                  id="nome"
                  value={destinoFormData.nome}
                  onChange={(e) => setDestinoFormData({ ...destinoFormData, nome: e.target.value })}
                  placeholder="Ex: Torre Eiffel"
                  required
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>

              <div>
                <Label htmlFor="cidade" className="text-white">Cidade *</Label>
                <Input
                  id="cidade"
                  value={destinoFormData.cidade}
                  onChange={(e) => setDestinoFormData({ ...destinoFormData, cidade: e.target.value })}
                  placeholder="Ex: Paris"
                  required
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pais" className="text-white">País *</Label>
                <Input
                  id="pais"
                  value={destinoFormData.pais}
                  onChange={(e) => setDestinoFormData({ ...destinoFormData, pais: e.target.value })}
                  placeholder="Ex: França"
                  required
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>

              <div>
                <Label htmlFor="endereco" className="text-white">Endereço</Label>
                <Input
                  id="endereco"
                  value={destinoFormData.endereco}
                  onChange={(e) => setDestinoFormData({ ...destinoFormData, endereco: e.target.value })}
                  placeholder="Endereço completo"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dataChegada" className="text-white">Data de Chegada *</Label>
                <Input
                  id="dataChegada"
                  type="date"
                  value={destinoFormData.dataChegada}
                  onChange={(e) => setDestinoFormData({ ...destinoFormData, dataChegada: e.target.value })}
                  required
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              <div>
                <Label htmlFor="dataSaida" className="text-white">Data de Saída *</Label>
                <Input
                  id="dataSaida"
                  type="date"
                  value={destinoFormData.dataSaida}
                  onChange={(e) => setDestinoFormData({ ...destinoFormData, dataSaida: e.target.value })}
                  required
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="idioma" className="text-white">Idioma Local</Label>
                <Input
                  id="idioma"
                  value={destinoFormData.idioma}
                  onChange={(e) => setDestinoFormData({ ...destinoFormData, idioma: e.target.value })}
                  placeholder="Ex: Francês"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>

              <div>
                <Label htmlFor="moeda" className="text-white">Moeda</Label>
                <Input
                  id="moeda"
                  value={destinoFormData.moeda}
                  onChange={(e) => setDestinoFormData({ ...destinoFormData, moeda: e.target.value })}
                  placeholder="Ex: EUR"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="fusoHorario" className="text-white">Fuso Horário</Label>
                <Input
                  id="fusoHorario"
                  value={destinoFormData.fusoHorario}
                  onChange={(e) => setDestinoFormData({ ...destinoFormData, fusoHorario: e.target.value })}
                  placeholder="Ex: UTC+1"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>

              <div>
                <Label htmlFor="voltagem" className="text-white">Voltagem</Label>
                <Input
                  id="voltagem"
                  value={destinoFormData.voltagem}
                  onChange={(e) => setDestinoFormData({ ...destinoFormData, voltagem: e.target.value })}
                  placeholder="Ex: 220V"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>

              <div>
                <Label htmlFor="tomada" className="text-white">Tipo de Tomada</Label>
                <Input
                  id="tomada"
                  value={destinoFormData.tomada}
                  onChange={(e) => setDestinoFormData({ ...destinoFormData, tomada: e.target.value })}
                  placeholder="Ex: Tipo C"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="temperaturaMed" className="text-white">Temperatura Média</Label>
                <Input
                  id="temperaturaMed"
                  value={destinoFormData.temperaturaMed}
                  onChange={(e) => setDestinoFormData({ ...destinoFormData, temperaturaMed: e.target.value })}
                  placeholder="Ex: 20°C"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>

              <div>
                <Label htmlFor="emergencia" className="text-white">Número de Emergência</Label>
                <Input
                  id="emergencia"
                  value={destinoFormData.emergencia}
                  onChange={(e) => setDestinoFormData({ ...destinoFormData, emergencia: e.target.value })}
                  placeholder="Ex: 112"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                onClick={() => {
                  setIsDestinoModalOpen(false);
                  resetDestinoForm();
                }}
                className="bg-zinc-800 hover:bg-zinc-700 text-white"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700"
              >
                Adicionar Destino
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
