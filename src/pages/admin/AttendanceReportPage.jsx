import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { CalendarCheck, Loader2, Users, Search, BarChart2, Hand } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import ActivityCalendar from '@/components/admin/attendance/ActivityCalendar';
import AttendanceStats from '@/components/admin/attendance/AttendanceStats';
import AttendanceLogTable from '@/components/admin/attendance/AttendanceLogTable';
import InteractiveAttendanceGrid from '@/components/admin/attendance/InteractiveAttendanceGrid';
import { startOfMonth, endOfMonth, getDaysInMonth, format, subMonths, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const AttendanceReportPage = () => {
  const { supabase } = useAuth();
  const { toast } = useToast();
  
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedDateForCall, setSelectedDateForCall] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [searchTerm, setSearchTerm] = useState('');
  
  const [attendanceData, setAttendanceData] = useState([]);
  const [justificationsData, setJustificationsData] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  const triggerUpdate = () => setUpdateTrigger(prev => prev + 1);

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('members')
        .select('id, codinome, discord_id')
        .is('data_saida', null)
        .order('codinome', { ascending: true });

      if (error) {
        toast({ title: 'Erro ao buscar membros', description: error.message, variant: 'destructive' });
      } else {
        setMembers(data);
      }
      setLoading(false);
    };
    
    const syncStats = async () => {
        const { error } = await supabase.rpc('sync_attendance_records');
        if (error) {
            toast({ title: "Erro ao sincronizar estatísticas", description: error.message, variant: "destructive" });
        }
    };

    fetchMembers();
    syncStats();
  }, [supabase, toast]);

  const fetchReportData = useCallback(async () => {
    if (!selectedMember || !selectedMonth) return;

    setLoadingReport(true);
    const monthDate = new Date(`${selectedMonth}-01T12:00:00Z`);
    const startDate = format(startOfMonth(monthDate), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(monthDate), 'yyyy-MM-dd');

    const [attendanceRes, justificationsRes] = await Promise.all([
      supabase
        .from('attendance_records')
        .select('date')
        .eq('member_id', selectedMember)
        .gte('date', startDate)
        .lte('date', endDate),
      supabase
        .from('justifications')
        .select('start_date, end_date')
        .eq('member_id', selectedMember)
        .eq('status', 'APROVADO')
        .lte('start_date', endDate)
        .gte('end_date', startDate)
    ]);

    if (attendanceRes.error) {
      toast({ title: 'Erro ao buscar presenças', description: attendanceRes.error.message, variant: 'destructive' });
    } else {
      setAttendanceData(attendanceRes.data);
    }

    if (justificationsRes.error) {
      toast({ title: 'Erro ao buscar justificativas', description: justificationsRes.error.message, variant: 'destructive' });
    } else {
      setJustificationsData(justificationsRes.data);
    }
    
    setLoadingReport(false);
  }, [selectedMember, selectedMonth, supabase, toast]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData, updateTrigger]);

  const monthOptions = useMemo(() => 
    Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(new Date(), i);
      return {
        value: format(date, 'yyyy-MM'),
        label: format(date, "MMMM 'de' yyyy", { locale: ptBR }),
      };
    }), []);

  const filteredMembers = useMemo(() => 
    members.filter(m => 
      m.codinome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.discord_id && m.discord_id.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [members, searchTerm]);

  const calendarData = useMemo(() => {
    if (!selectedMember) return {};
    const monthDate = new Date(`${selectedMonth}-01T12:00:00Z`);
    const daysInMonth = getDaysInMonth(monthDate);
    const data = {};
    const today = startOfDay(new Date());

    for (let i = 1; i <= daysInMonth; i++) {
      const dayDate = startOfDay(new Date(monthDate.getFullYear(), monthDate.getMonth(), i));
      if (dayDate > today) continue;

      const dateString = format(dayDate, 'yyyy-MM-dd');
      let status = 'absent_unjustified';

      const isPresent = attendanceData.some(rec => rec.date === dateString);
      if (isPresent) {
        status = 'present';
      } else {
        const isJustified = justificationsData.some(j => {
            const startDate = startOfDay(new Date(j.start_date));
            const endDate = startOfDay(new Date(j.end_date));
            return dayDate >= startDate && dayDate <= endDate;
        });
        if (isJustified) {
            status = 'absent_justified';
        }
      }
      data[dateString] = status;
    }
    return data;
  }, [selectedMember, selectedMonth, attendanceData, justificationsData]);

  return (
    <motion.div initial="hidden" animate="visible" variants={cardVariants} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-semibold text-foreground flex items-center">
          <CalendarCheck className="mr-3 h-8 w-8 text-primary" /> Gestão de Frequência
        </h1>
      </div>

      <Tabs defaultValue="call_list" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="call_list"><Hand className="mr-2 h-4 w-4"/>Chamada Interativa</TabsTrigger>
          <TabsTrigger value="individual_report"><Users className="mr-2 h-4 w-4"/>Relatório Individual</TabsTrigger>
          <TabsTrigger value="general_log"><BarChart2 className="mr-2 h-4 w-4"/>Log Geral</TabsTrigger>
        </TabsList>
        
        <TabsContent value="call_list" className="mt-6">
          <Card className="glassmorphic">
            <CardHeader>
              <CardTitle>Controle de Presença</CardTitle>
              <CardDescription>Selecione uma data para visualizar e gerenciar a presença dos membros.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="max-w-xs">
                    <label htmlFor="date-select" className="text-sm font-medium text-muted-foreground flex items-center mb-2">
                        Data da Chamada
                    </label>
                    <Input
                      id="date-select"
                      type="date"
                      value={selectedDateForCall}
                      onChange={(e) => setSelectedDateForCall(e.target.value)}
                      className="input-dark"
                    />
                </div>
            </CardContent>
          </Card>
          {selectedDateForCall && <InteractiveAttendanceGrid selectedDate={selectedDateForCall} key={selectedDateForCall} onAttendanceChange={triggerUpdate} />}
        </TabsContent>

        <TabsContent value="individual_report" className="mt-6">
          <Card className="glassmorphic">
            <CardHeader>
              <CardTitle>Filtros do Relatório Individual</CardTitle>
              <CardDescription>Selecione um membro e um mês para gerar o relatório de frequência.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="search-member" className="text-sm font-medium text-muted-foreground">Buscar Membro</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="search-member"
                    placeholder="Buscar por codinome ou Discord ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select onValueChange={setSelectedMember} value={selectedMember || ''} disabled={loading}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder={loading ? "Carregando membros..." : "Selecione um membro"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredMembers.length > 0 ? filteredMembers.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.codinome}
                      </SelectItem>
                    )) : <p className="p-2 text-sm text-muted-foreground">Nenhum membro encontrado.</p>}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="month-select-report" className="text-sm font-medium text-muted-foreground">Mês do Relatório</label>
                <Select onValueChange={setSelectedMonth} value={selectedMonth}>
                  <SelectTrigger id="month-select-report" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {loadingReport && (
            <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 text-primary animate-spin" /> <p className="ml-4 text-xl text-muted-foreground">Gerando relatório...</p></div>
          )}

          {!loadingReport && !selectedMember && (
             <Card className="text-center glassmorphic mt-6">
                <CardContent className="p-10">
                    <Users size={48} className="mx-auto text-muted-foreground mb-4" />
                    <p className="text-xl text-muted-foreground">Selecione um membro para começar.</p>
                </CardContent>
            </Card>
          )}

          {!loadingReport && selectedMember && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 xl:grid-cols-5 gap-6 mt-6">
              <div className="xl:col-span-3">
                 <ActivityCalendar data={calendarData} month={selectedMonth} />
              </div>
              <div className="xl:col-span-2">
                <AttendanceStats data={calendarData} />
              </div>
            </motion.div>
          )}
        </TabsContent>
        
        <TabsContent value="general_log" className="mt-6">
            <AttendanceLogTable selectedMonth={selectedMonth} key={`${selectedMonth}-${updateTrigger}`} />
        </TabsContent>

      </Tabs>
    </motion.div>
  );
};

export default AttendanceReportPage;