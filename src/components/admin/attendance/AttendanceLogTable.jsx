import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, UserX, Search } from 'lucide-react';
import { startOfMonth, endOfMonth, getDaysInMonth, format } from 'date-fns';
import { PATENTE_ORDER_MAP } from '@/components/admin/members/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ptBR } from 'date-fns/locale';

const AttendanceLogTable = ({ selectedMonth }) => {
  const { supabase } = useAuth();
  const { toast } = useToast();
  const [logData, setLogData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [daysInMonth, setDaysInMonth] = useState(0);

  const highCommandPatentes = useMemo(() => Object.keys(PATENTE_ORDER_MAP).filter(
    (patente) => PATENTE_ORDER_MAP[patente] >= PATENTE_ORDER_MAP['Capitão']
  ), []);

  const fetchLogData = useCallback(async () => {
    if (!selectedMonth) return;
    setLoading(true);

    try {
      const [year, month] = selectedMonth.split('-').map(Number);
      const monthDate = new Date(year, month - 1, 1);
      
      const startDate = format(startOfMonth(monthDate), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(monthDate), 'yyyy-MM-dd');
      const currentDaysInMonth = getDaysInMonth(monthDate);
      setDaysInMonth(currentDaysInMonth);

      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('id, codinome, patente_atual')
        .is('data_saida', null)
        .not('patente_atual', 'in', `(${highCommandPatentes.map(p => `'${p}'`).join(',')})`);

      if (membersError) throw membersError;

      const memberIds = members.map(m => m.id);
      if (memberIds.length === 0) {
        setLogData([]);
        setLoading(false);
        return;
      }

      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('member_id, date, created_at')
        .in('member_id', memberIds)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('created_at', { ascending: false });
      
      if (attendanceError) throw attendanceError;

      const dataByMember = members.map(member => {
        const memberRecords = attendanceRecords.filter(r => r.member_id === member.id);
        const presences = new Set(memberRecords.map(r => r.date)).size;
        const frequency = currentDaysInMonth > 0 ? (presences / currentDaysInMonth) * 100 : 0;
        const lastPresence = memberRecords.length > 0 ? memberRecords[0].created_at : null;
        
        return {
          id: member.id,
          name: member.codinome,
          patente: member.patente_atual,
          frequency: frequency,
          presenceCount: presences,
          presenceLog: memberRecords.map(r => r.date).sort(),
          lastPresenceTimestamp: lastPresence,
        };
      }).sort((a, b) => b.frequency - a.frequency);

      setLogData(dataByMember);

    } catch (error) {
      toast({ title: 'Erro ao buscar dados do log', description: error.message, variant: 'destructive' });
      setLogData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, supabase, toast, highCommandPatentes]);

  useEffect(() => {
    fetchLogData();
  }, [fetchLogData]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return logData;
    return logData.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [logData, searchTerm]);

  const getFrequencyBadgeVariant = (frequency) => {
    if (frequency >= 75) return 'success';
    if (frequency >= 50) return 'warning';
    return 'destructive';
  };

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
        <CardTitle>Log Geral de Frequência</CardTitle>
        <CardDescription>
          Visão detalhada da frequência dos membros para o mês de {format(new Date(selectedMonth.split('-')[0], selectedMonth.split('-')[1] - 1, 1), 'MMMM yyyy', { locale: ptBR })}.
        </CardDescription>
        <div className="relative pt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar membro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-dark pl-10 w-full max-w-sm"
            />
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] w-full">
          <Table>
            <TableHeader className="sticky top-0 bg-card/80 backdrop-blur-sm">
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Patente</TableHead>
                <TableHead className="text-center">Frequência</TableHead>
                <TableHead>Log de Presenças ({daysInMonth} dias)</TableHead>
                <TableHead className="text-right">Última Presença (Data e Hora)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.patente}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getFrequencyBadgeVariant(item.frequency)}>
                        {item.frequency.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.presenceCount > 0 ? `${item.presenceCount} dia(s)` : 'Nenhuma'}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.lastPresenceTimestamp ? format(new Date(item.lastPresenceTimestamp), 'dd/MM/yyyy HH:mm:ss') : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex flex-col justify-center items-center">
                        <UserX size={32} className="text-muted-foreground mb-2"/>
                        <p className="text-muted-foreground">Nenhum membro encontrado.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default AttendanceLogTable;