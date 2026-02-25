'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { formatarMoeda } from '@/lib/financeiro-helper';
import { useTranslations } from 'next-intl';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/dexie';

export default function MarketOverview() {
    const t = useTranslations('investments');

    const [marketData, setMarketData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Chart States
    const [userAssets, setUserAssets] = useState<any[]>([]);
    const [selectedAsset, setSelectedAsset] = useState<string>('^BVSP');
    const [selectedPeriod, setSelectedPeriod] = useState<'1d' | '1mo' | '1y'>('1mo');
    const [chartData, setChartData] = useState<any[]>([]);
    const [isChartLoading, setIsChartLoading] = useState(false);

    useEffect(() => {
        const fetchMarket = async () => {
            try {
                // Trocado BTC-BRL por BTC-USD pois a API gratuita não retorna BTC-BRL diretamente na cotação
                const tickers = '^BVSP,USDBRL=X,BTC-USD,EURBRL=X,PETR4,NVDC34';
                const res = await fetch(`https://brapi.dev/api/quote/${tickers}?token=u6eKiojA48yU4cMkdLqT8V`);
                const data = await res.json();

                if (data.results) {
                    // Conversão manual do Bitcoin para Reais
                    const btcUsd = data.results.find((r: any) => r.symbol === 'BTC-USD');
                    const usdBrl = data.results.find((r: any) => r.symbol === 'USDBRL=X');

                    if (btcUsd && usdBrl) {
                        data.results.push({
                            symbol: 'BTC-BRL',
                            regularMarketPrice: btcUsd.regularMarketPrice * usdBrl.regularMarketPrice,
                            regularMarketChangePercent: btcUsd.regularMarketChangePercent // Mantemos a variacao em dolar como base
                        });
                    }

                    const formatValue = (symbol: string, val: number) => {
                        if (symbol === '^BVSP') return val.toLocaleString('pt-BR') + ' pts';
                        return formatarMoeda(val);
                    };

                    const names: Record<string, string> = {
                        '^BVSP': 'IBOVESPA',
                        'USDBRL=X': 'Dólar (USD)',
                        'BTC-BRL': 'Bitcoin (BTC)',
                        'EURBRL=X': 'Euro (EUR)',
                        'PETR4': 'Petrobras (PETR4)',
                        'NVDC34': 'Nvidia (BDR)'
                    };

                    const rawOrder = ['^BVSP', 'USDBRL=X', 'BTC-BRL', 'EURBRL=X', 'PETR4', 'NVDC34'];

                    const formattedMap = new Map();
                    data.results.forEach((item: any) => {
                        const isPositive = item.regularMarketChangePercent >= 0;
                        const sign = isPositive ? '+' : '';
                        const changeStr = `${sign}${item.regularMarketChangePercent.toFixed(2)}%`;

                        formattedMap.set(item.symbol, {
                            name: names[item.symbol] || item.symbol,
                            value: formatValue(item.symbol, item.regularMarketPrice),
                            change: changeStr,
                            isPositive
                        });
                    });

                    // Garantir a ordem visual correta
                    const ordered = rawOrder.map(sym => formattedMap.get(sym)).filter(Boolean);
                    setMarketData(ordered);
                }
            } catch (err) {
                console.error("Erro ao carregar market data", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMarket();
    }, []);

    // Load user portfolio assets
    useEffect(() => {
        const loadAssets = async () => {
            try {
                const ativos = await db.ativosInvestimento.toArray();
                const uniqueTickers = Array.from(new Set(ativos.map(a => a.nome)));
                setUserAssets(uniqueTickers);
            } catch (err) {
                console.error("Erro ao carregar ativos da carteira", err);
            }
        };
        loadAssets();
    }, []);

    // Fetch Historical Data for Chart
    useEffect(() => {
        const fetchHistory = async () => {
            setIsChartLoading(true);
            try {
                // Determine interval based on period
                let interval = '1d';
                if (selectedPeriod === '1d') interval = '15m';
                else if (selectedPeriod === '1y') interval = '1wk';

                // We handle BTC specially since BTC-BRL historical might fail or we need BTC-USD
                // For simplicity, we fallback to BTC-USD history if they pick 'BTC-BRL', 
                // but real values won't perfectly match BRL without multiplying every point by historical BRL.
                // We will just fetch BTC-USD for geometry shape.
                let searchTicker = selectedAsset;
                if (searchTicker === 'BTC-BRL') searchTicker = 'BTC-USD';

                const res = await fetch(`https://brapi.dev/api/quote/${searchTicker}?range=${selectedPeriod}&interval=${interval}&token=u6eKiojA48yU4cMkdLqT8V`);
                const data = await res.json();

                if (data.results && data.results[0] && data.results[0].historicalDataPrice) {
                    const history = data.results[0].historicalDataPrice.map((point: any) => {
                        const date = new Date(point.date * 1000);
                        let dateStr = date.toLocaleDateString('pt-BR');
                        if (selectedPeriod === '1d') {
                            dateStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                        } else if (selectedPeriod === '1y') {
                            dateStr = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
                        }

                        return {
                            date: dateStr,
                            value: point.close,
                            timestamp: point.date
                        };
                    });

                    // Filter out null closes
                    setChartData(history.filter((h: any) => h.value != null));
                } else {
                    setChartData([]);
                }

            } catch (err) {
                console.error('Erro ao buscar historico', err);
                setChartData([]);
            } finally {
                setIsChartLoading(false);
            }
        };

        if (selectedAsset) {
            fetchHistory();
        }
    }, [selectedAsset, selectedPeriod]);

    // Calculate chart delta color
    const chartColor = useMemo(() => {
        if (!chartData || chartData.length < 2) return '#22c55e'; // default green
        const first = chartData[0].value;
        const last = chartData[chartData.length - 1].value;
        return last >= first ? '#22c55e' : '#ef4444'; // green if up, red if down
    }, [chartData]);

    const formatTooltip = (value: any) => {
        if (value === undefined || value === null) return ['0', 'Cotação'];
        if (selectedAsset === '^BVSP') return [`${Number(value).toLocaleString('pt-BR')} pts`, 'Pontos'];
        return [formatarMoeda(Number(value)), 'Cotação'];
    };

    const combinedAssets = useMemo(() => {
        const standard = [
            { id: '^BVSP', name: 'IBOVESPA' },
            { id: 'USDBRL=X', name: 'Dólar (USD)' },
            { id: 'BTC-BRL', name: 'Bitcoin (BTC)' },
            { id: 'EURBRL=X', name: 'Euro (EUR)' },
            { id: 'PETR4', name: 'Petrobras (PETR4)' },
            { id: 'NVDC34', name: 'Nvidia (BDR)' }
        ];

        const userAdded = userAssets
            .filter(ticker => !standard.find(s => s.id === ticker))
            .map(ticker => ({ id: ticker, name: ticker }));

        return [...standard, ...userAdded];
    }, [userAssets]);

    return (
        <Card className="bg-zinc-900 border-zinc-800 h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-500" />
                    {t('marketOverview')}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900 relative">
                {isLoading && (
                    <div className="absolute inset-0 z-10 bg-zinc-900/50 backdrop-blur-sm flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
                    </div>
                )}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {marketData.map((item, i) => (
                        <div key={i} className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors">
                            <div className="text-sm text-zinc-400 mb-1">{item.name}</div>
                            <div className="text-xl font-bold text-white tracking-tight">{item.value}</div>
                            <div className={`text-sm mt-1 flex items-center font-medium ${item.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                {item.isPositive ? (
                                    <TrendingUp className="w-3 h-3 mr-1" />
                                ) : (
                                    <TrendingDown className="w-3 h-3 mr-1" />
                                )}
                                {item.change}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Chart Section */}
                <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                        <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                            <SelectTrigger className="w-full sm:w-[250px] bg-zinc-900 border-zinc-800 text-white font-medium">
                                <SelectValue placeholder="Selecione um Ativo" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800 max-h-[300px]">
                                <div className="px-2 py-1.5 text-xs font-semibold text-zinc-500 uppercase">Mercado Padrão</div>
                                {combinedAssets.slice(0, 6).map(asset => (
                                    <SelectItem key={asset.id} value={asset.id} className="text-white hover:bg-zinc-800">{asset.name}</SelectItem>
                                ))}
                                {combinedAssets.length > 6 && (
                                    <>
                                        <div className="px-2 py-1.5 text-xs font-semibold text-zinc-500 uppercase mt-2 border-t border-zinc-800/50 pt-2">Sua Carteira</div>
                                        {combinedAssets.slice(6).map(asset => (
                                            <SelectItem key={asset.id} value={asset.id} className="text-white hover:bg-zinc-800">{asset.name}</SelectItem>
                                        ))}
                                    </>
                                )}
                            </SelectContent>
                        </Select>

                        <div className="flex bg-zinc-900 rounded-md border border-zinc-800 p-1 w-full sm:w-auto">
                            {[
                                { id: '1d', label: '1D' },
                                { id: '1mo', label: '1M' },
                                { id: '1y', label: '1A' }
                            ].map((period) => (
                                <Button
                                    key={period.id}
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedPeriod(period.id as any)}
                                    className={`flex-1 sm:flex-none text-xs h-7 px-3 rounded-sm ${selectedPeriod === period.id
                                        ? 'bg-zinc-800 text-white shadow-sm'
                                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                                        }`}
                                >
                                    {period.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="h-[250px] w-full relative">
                        {isChartLoading && (
                            <div className="absolute inset-0 z-10 bg-zinc-900/50 backdrop-blur-sm flex items-center justify-center rounded-lg">
                                <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
                            </div>
                        )}
                        {!isChartLoading && chartData.length === 0 ? (
                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-zinc-500">
                                <Activity className="w-8 h-8 mb-2 opacity-20" />
                                <p className="text-sm">Dados históricos não disponíveis</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#71717a', fontSize: 12 }}
                                        tickMargin={10}
                                        minTickGap={30}
                                    />
                                    <YAxis
                                        hide
                                        domain={['dataMin', 'dataMax']}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                                        itemStyle={{ color: chartColor, fontWeight: 'bold' }}
                                        labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
                                        formatter={formatTooltip}
                                        labelFormatter={(label) => `Data: ${label}`}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke={chartColor}
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorValue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
