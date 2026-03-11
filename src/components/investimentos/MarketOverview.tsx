'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { formatarMoeda } from '@/lib/financeiro-helper';
import { useTranslations } from 'next-intl';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

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
                const rawTickers = ['^BVSP', 'USDBRL=X', 'BTC-USD', 'EURBRL=X', 'PETR4', 'NVDC34'];

                // Fetch each ticker individually to avoid free plan "1 asset per request" limit
                const promises = rawTickers.map(ticker =>
                    fetch(`https://brapi.dev/api/quote/${ticker}?token=u6eKiojA48yU4cMkdLqT8V`)
                        .then(res => res.json())
                        .catch(() => ({ results: [] }))
                );

                const responses = await Promise.all(promises);

                // Aggregate all results into a single array
                const allResults = responses.flatMap(res => res.results || []);

                if (allResults.length > 0) {
                    // Conversão manual do Bitcoin para Reais
                    const btcUsd = allResults.find((r: any) => r.symbol === 'BTC-USD');
                    const usdBrl = allResults.find((r: any) => r.symbol === 'USDBRL=X');

                    if (btcUsd && usdBrl) {
                        allResults.push({
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
                    allResults.forEach((item: any) => {
                        const isPositive = item.regularMarketChangePercent >= 0;
                        const sign = isPositive ? '+' : '';
                        const changeStr = `${sign}${item.regularMarketChangePercent?.toFixed(2) || '0.00'}%`;

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
                const res = await fetch('/api/investimentos');
                if (res.ok) {
                    const json = await res.json();
                    const ativos = json.data || [];
                    const uniqueTickers = Array.from(new Set(ativos.map((a: any) => a.nome))) as string[];
                    setUserAssets(uniqueTickers);
                }
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
        <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b border-zinc-800/50 shrink-0">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    {t('marketOverview')}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-zinc-800 relative">
                {isLoading && (
                    <div className="absolute inset-0 z-10 bg-zinc-950/50 backdrop-blur-sm flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                    </div>
                )}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                    {marketData.map((item, i) => (
                        <div key={i} className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/50 hover:border-zinc-700/50 transition-all group">
                            <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2 group-hover:text-zinc-500 transition-colors">{item.name}</div>
                            <div className="text-2xl font-black text-white tracking-tight leading-none">{item.value}</div>
                            <div className={`text-[10px] sm:text-xs mt-3 flex items-center font-black uppercase tracking-widest ${item.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                                {item.isPositive ? (
                                    <TrendingUp className="w-3 h-3 mr-1.5" />
                                ) : (
                                    <TrendingDown className="w-3 h-3 mr-1.5" />
                                )}
                                {item.change}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Chart Section */}
                <div className="mt-8 rounded-2xl border border-zinc-800/50 bg-zinc-900/20 p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
                        <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                            <SelectTrigger className="w-full sm:w-[280px] bg-zinc-900/50 border-zinc-800/50 text-white font-bold rounded-xl h-11">
                                <SelectValue placeholder="Selecione um Ativo" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800 max-h-[300px] rounded-xl">
                                <div className="px-3 py-2 text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">Mercado Padrão</div>
                                {combinedAssets.slice(0, 6).map(asset => (
                                    <SelectItem key={asset.id} value={asset.id} className="text-sm font-bold text-zinc-300 focus:bg-zinc-800 focus:text-white rounded-lg">{asset.name}</SelectItem>
                                ))}
                                {combinedAssets.length > 6 && (
                                    <>
                                        <div className="px-3 py-2 text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] mt-3 border-t border-zinc-800/50 pt-3">Sua Carteira</div>
                                        {combinedAssets.slice(6).map(asset => (
                                            <SelectItem key={asset.id} value={asset.id} className="text-sm font-bold text-zinc-300 focus:bg-zinc-800 focus:text-white rounded-lg">{asset.name}</SelectItem>
                                        ))}
                                    </>
                                )}
                            </SelectContent>
                        </Select>

                        <div className="flex bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-1.5 w-full sm:w-auto min-w-[200px]">
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
                                    className={`flex-1 sm:flex-none text-[10px] font-black uppercase tracking-widest h-10 px-6 rounded-xl transition-all ${selectedPeriod === period.id
                                        ? 'bg-zinc-800 text-emerald-500 shadow-sm'
                                        : 'text-zinc-600 hover:text-white hover:bg-zinc-800/50'
                                        }`}
                                >
                                    {period.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="h-[280px] w-full relative">
                        {isChartLoading && (
                            <div className="absolute inset-0 z-10 bg-zinc-950/20 backdrop-blur-[2px] flex items-center justify-center rounded-2xl">
                                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                            </div>
                        )}
                        {!isChartLoading && chartData.length === 0 ? (
                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-zinc-600">
                                <Activity className="w-10 h-10 mb-4 opacity-10" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Dados históricos não disponíveis</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#3f3f46', fontSize: 10, fontWeight: 'bold' }}
                                        tickMargin={15}
                                        minTickGap={40}
                                    />
                                    <YAxis
                                        hide
                                        domain={['dataMin', 'dataMax']}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', color: '#fff', border: '1px solid rgba(255,255,255,0.05)', fontSize: '10px' }}
                                        itemStyle={{ color: chartColor, fontWeight: '900', textTransform: 'uppercase', fontSize: '12px' }}
                                        labelStyle={{ color: '#52525b', marginBottom: '8px', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '9px', letterSpacing: '0.1em' }}
                                        formatter={formatTooltip}
                                        labelFormatter={(label) => `Data: ${label}`}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke={chartColor}
                                        strokeWidth={4}
                                        fill={chartColor}
                                        fillOpacity={0.05}
                                        animationDuration={1000}
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
