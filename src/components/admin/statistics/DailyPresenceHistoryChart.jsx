import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { CalendarDays, Loader2 } from 'lucide-react';
import { format, subDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-3 bg-card/90 backdrop-blur-sm border border-border rounded-lg shadow-lg">
        <p className="label text-primary font-semibold">{`${label}`}</p>
        <p style={{ color: payload[0].stroke }}>{`Presença: ${payload[0].value}%`}</p>
        <p className="text-muted-foreground text-sm">{`Presentes: ${data.present_members}`}</p>
        <p className="text-muted-foreground text-sm">{`Ativos: ${data.total_active_members}`}</p>
      </div>
    );
  }
  return null;
};

const DailyPresenceHistoryChart = ({ cardVariants }) => {
  const { supabase } = useAuth();
  const { toast } = useToast();
  const [presenceData, setPresenceData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Função para buscar os dados consolidados do histórico (últimos 30 dias)
  const fetchPresenceHistory = useCallback(async () => {
    try {
      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('daily_attendance_stats')
        .select('*')
        .gte('stat_date', thirtyDaysAgo)
        .order('stat_date', { ascending: true });

      if (error) throw error;

      const formattedData = data.map(item => ({
        ...item,
        name: format(new Date(item.stat_date), 'dd/MM', { locale: ptBR }),
        attendance_percentage: parseFloat(item.attendance_percentage)
      }));

      return formattedData;

    } catch (error) {
      toast({
        title: "Erro ao buscar histórico de presença",
        description: error.message,
        variant: "destructive",
      });
      return [];
    }
  }, [supabase, toast]);

  // Função para buscar e atualizar a presença em tempo real
  const fetchRealtimeAttendance = useCallback(async () => {
    try {
      // 1. Busca o número total de membros ativos (para o cálculo da porcentagem)
      const { data: activeMembersData, error: activeMembersError } = await supabase
        .from('members')
        .select('id')
        .eq('is_active', true);
      
      if (activeMembersError) throw activeMembersError;
      const totalActiveMembers = activeMembersData.length;

      // 2. Conta as presenças do dia atual
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data: todayAttendance, error: todayAttendanceError } = await supabase
        .from('attendance_records')
        .select('member_id')
        .eq('attendance_date', today);
        
      if (todayAttendanceError) throw todayAttendanceError;
      const presentMembers = todayAttendance.length;

      // 3. Calcula a porcentagem de presença para o dia atual
      const attendancePercentage = totalActiveMembers > 0 ? (presentMembers / totalActiveMembers) * 100 : 0;
      
      return {
        stat_date: today,
        name: format(new Date(), 'dd/MM', { locale: ptBR }),
        attendance_percentage: parseFloat(attendancePercentage.toFixed(2)),
        present_members: presentMembers,
        total_active_members: totalActiveMembers,
      };
    } catch (error) {
      console.error("Erro na busca de dados em tempo real:", error);
      return {
        stat_date: format(new Date(), 'yyyy-MM-dd'),
        name: format(new Date(), 'dd/MM', { locale: ptBR }),
        attendance_percentage: 0,
        present_members: 0,
        total_active_members: 0,
      };
    }
  }, [supabase]);

  useEffect(() => {
    // Carrega os dados históricos e em tempo real
    const loadData = async () => {
      try {
        const historyData = await fetchPresenceHistory();
        const realtimeData = await fetchRealtimeAttendance();

        // Verifica se o dia atual já está nos dados históricos
        const todayExistsInHistory = historyData.some(item => isSameDay(new Date(item.stat_date), new Date(realtimeData.stat_date)));

        let combinedData = [...historyData];

        if (!todayExistsInHistory) {
          combinedData.push(realtimeData);
        } else {
          combinedData = historyData.map(item => 
            isSameDay(new Date(item.stat_date), new Date(realtimeData.stat_date)) ? realtimeData : item
          );
        }

        setPresenceData(combinedData);
      } catch (error) {
        toast({
          title: "Erro de carregamento",
          description: "Não foi possível carregar os dados completos. Por favor, verifique a conexão.",
          variant: "destructive",
        });
        console.error("Erro no carregamento principal:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // 4. Configura o listener do Supabase para atualizações em tempo real
    const attendanceChannel = supabase
      .channel('daily_attendance_updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance_records' }, async payload => {
        const updatedRealtimeData = await fetchRealtimeAttendance();
        setPresenceData(prevData => {
          const newData = prevData.map(item => 
            isSameDay(new Date(item.stat_date), new Date(updatedRealtimeData.stat_date)) ? updatedRealtimeData : item
          );

          if (!newData.some(item => isSameDay(new Date(item.stat_date), new Date(updatedRealtimeData.stat_date)))) {
            newData.push(updatedRealtimeData);
          }
          return newData;
        });
      })
      .subscribe();

    // Limpeza do listener quando o componente for desmontado
    return () => {
      supabase.removeChannel(attendanceChannel);
    };

  }, [fetchPresenceHistory, fetchRealtimeAttendance, supabase, toast]);

  return (
    <motion.div variants={cardVariants} custom={4} initial="hidden" animate="visible">
      <Card className="glassmorphic border border-primary/30">
        <CardHeader>
          <CardTitle className="text-xl text-primary flex items-center">
            <CalendarDays className="mr-2 h-6 w-6"/> Histórico de Presença Diária
          </CardTitle>
          <CardDescription>
            Percentual de membros ativos que marcaram presença nos últimos 30 dias.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[350px]">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : presenceData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={presenceData}
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{fontSize: "12px"}}/>
                <Line 
                  type="monotone" 
                  dataKey="attendance_percentage" 
                  name="Presença"
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#ef4444" }}
                  activeDot={{ r: 8, stroke: 'hsl(var(--card))', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex justify-center items-center h-full">
              <p className="text-muted-foreground">Nenhum dado de presença encontrado para o período.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DailyPresenceHistoryChart;