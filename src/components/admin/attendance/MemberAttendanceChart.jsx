
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar, Cell, CartesianGrid } from 'recharts';
import { Loader2, UserX } from 'lucide-react';
import { startOfMonth, endOfMonth, getDaysInMonth, format } from 'date-fns';
import { PATENTE_ORDER_MAP } from '@/components/admin/members/utils';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-card/90 backdrop-blur-sm border border-border rounded-lg shadow-lg">
        <p className="label text-primary font-semibold">{`${label}`}</p>
        <p style={{ color: payload[0].fill }}>{`Frequência: ${payload[0].value.toFixed(1)}%`}</p>
        <p className="text-muted-foreground text-sm">{`Presenças: ${payload[0].payload.presences}`}</p>
        <p className="text-muted-foreground text-sm">{`Patente: ${payload[0].payload.patente}`}</p>
      </div>
    );
  }
  return null;
};

const MemberAttendanceChart = ({ selectedMonth }) => {
  const { supabase } = useAuth();
  const { toast } = useToast();
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  const highCommandPatentes = useMemo(() => Object.keys(PATENTE_ORDER_MAP).filter(
    (patente) => PATENTE_ORDER_MAP[patente] >= PATENTE_ORDER_MAP['Capitão']
  ), []);

  const fetchChartData = useCallback(async () => {
    if (!selectedMonth) return;
    setLoading(true);

    try {
      const monthDate = new Date(`${selectedMonth}-02`);
      const startDate = format(startOfMonth(monthDate), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(monthDate), 'yyyy-MM-dd');
      const daysInMonth = getDaysInMonth(monthDate);

      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('id, codinome, patente_atual')
        .is('data_saida', null)
        .not('patente_atual', 'in', `(${highCommandPatentes.join(',')})`);

      if (membersError) throw membersError;

      const memberIds = members.map(m => m.id);

      if (memberIds.length === 0) {
        setChartData([]);
        setLoading(false);
        return;
      }

      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('member_id, date')
        .in('member_id', memberIds)
        .gte('date', startDate)
        .lte('date', endDate);
      
      if (attendanceError) throw attendanceError;

      const attendanceCounts = attendanceRecords.reduce((acc, record) => {
        acc[record.member_id] = (acc[record.member_id] || 0) + 1;
        return acc;
      }, {});

      const data = members.map(member => {
        const presences = attendanceCounts[member.id] || 0;
        const frequency = daysInMonth > 0 ? (presences / daysInMonth) * 100 : 0;
        return {
          name: member.codinome,
          frequency: frequency,
          presences: presences,
          patente: member.patente_atual,
        };
      }).sort((a, b) => b.frequency - a.frequency);

      setChartData(data);

    } catch (error) {
      toast({ title: 'Erro ao buscar dados do gráfico', description: error.message, variant: 'destructive' });
      setChartData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, supabase, toast, highCommandPatentes]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);
  
  const getBarColor = (frequency) => {
    if (frequency >= 75) return '#22c55e'; // green
    if (frequency >= 50) return '#f97316'; // orange
    return '#ef4444'; // red
  };
  
  const chartHeight = useMemo(() => {
    const baseHeight = 150;
    const heightPerMember = 35;
    return baseHeight + chartData.length * heightPerMember;
  }, [chartData.length]);


  if (loading) {
    return (
      <Card className="glassmorphic">
        <CardContent className="h-96 flex justify-center items-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glassmorphic">
      <CardHeader>
        <CardTitle>Frequência Geral de Membros no Mês</CardTitle>
        <CardDescription>
          Percentual de presença dos membros (excluindo Capitão e patentes superiores) no mês selecionado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ height: `${chartHeight}px`, width: '100%' }}>
            {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                    layout="vertical"
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" domain={[0, 100]} tickFormatter={(value) => `${value}%`}/>
                    <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={120} 
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fontSize: 12 }}
                        interval={0}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--primary)/0.1)' }} />
                    <Bar dataKey="frequency" name="Frequência" barSize={20}>
                         {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getBarColor(entry.frequency)} />
                        ))}
                    </Bar>
                    </BarChart>
                </ResponsiveContainer>
             ) : (
                <div className="flex flex-col justify-center items-center h-full">
                    <UserX size={48} className="text-muted-foreground mb-4"/>
                    <p className="text-xl text-muted-foreground">Nenhum membro encontrado para os filtros definidos.</p>
                </div>
            )}
        </div>
        <div className="flex justify-center items-center space-x-4 mt-6 text-sm">
            <div className="flex items-center"><div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div><span>{'>='} 75% (Excelente)</span></div>
            <div className="flex items-center"><div className="w-4 h-4 rounded-full bg-orange-500 mr-2"></div><span>{'>='} 50% (Bom)</span></div>
            <div className="flex items-center"><div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div><span>{'<'} 50% (Atenção)</span></div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MemberAttendanceChart;
  