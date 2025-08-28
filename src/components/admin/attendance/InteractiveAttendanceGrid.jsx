
import React, { useState, useEffect, useCallback, useMemo } from 'react';
    import { useAuth } from '@/contexts/AuthContext';
    import { useToast } from '@/components/ui/use-toast';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Loader2, UserX, Check, X, Search } from 'lucide-react';
    import { PATENTE_ORDER_MAP } from '@/components/admin/members/utils';
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import { Button } from '@/components/ui/button';
    import { motion, AnimatePresence } from 'framer-motion';
    import { Input } from '@/components/ui/input';
    import { format } from 'date-fns';

    const InteractiveAttendanceGrid = ({ selectedDate, onAttendanceChange }) => {
      const { supabase } = useAuth();
      const { toast } = useToast();
      const [members, setMembers] = useState([]);
      const [loading, setLoading] = useState(true);
      const [processingMember, setProcessingMember] = useState(null);
      const [searchTerm, setSearchTerm] = useState('');

      const highCommandPatentes = useMemo(() => Object.keys(PATENTE_ORDER_MAP).filter(
        (patente) => PATENTE_ORDER_MAP[patente] >= PATENTE_ORDER_MAP['Capitão']
      ), []);

      const fetchAttendanceData = useCallback(async () => {
        if (!selectedDate) return;
        setLoading(true);

        try {
          const { data: memberData, error: membersError } = await supabase
            .from('members')
            .select('id, codinome, patente_atual, avatar_url')
            .is('data_saida', null)
            .not('patente_atual', 'in', `(${highCommandPatentes.join(',')})`)
            .order('codinome', { ascending: true });

          if (membersError) throw membersError;

          const memberIds = memberData.map(m => m.id);

          if (memberIds.length === 0) {
            setMembers([]);
            setLoading(false);
            return;
          }

          const { data: attendanceRecords, error: attendanceError } = await supabase
            .from('attendance_records')
            .select('member_id')
            .in('member_id', memberIds)
            .eq('date', selectedDate);
          
          if (attendanceError) throw attendanceError;

          const presentMemberIds = new Set(attendanceRecords.map(r => r.member_id));

          const combinedData = memberData.map(member => ({
            ...member,
            isPresent: presentMemberIds.has(member.id),
          }));

          setMembers(combinedData);

        } catch (error) {
          toast({ title: 'Erro ao buscar dados de presença', description: error.message, variant: 'destructive' });
          setMembers([]);
        } finally {
          setLoading(false);
        }
      }, [selectedDate, supabase, toast, highCommandPatentes]);

      useEffect(() => {
        fetchAttendanceData();
      }, [fetchAttendanceData]);

      const handleTogglePresence = async (memberId, isPresent) => {
        setProcessingMember(memberId);
        try {
          if (isPresent) {
            const { error } = await supabase
              .from('attendance_records')
              .delete()
              .eq('member_id', memberId)
              .eq('date', selectedDate);
            
            if (error) throw error;
            toast({ title: 'Presença Removida', description: 'O membro foi marcado como ausente.', variant: 'success' });
          } else {
            const { error } = await supabase
              .from('attendance_records')
              .insert({ member_id: memberId, date: selectedDate });

            if (error) throw error;
            toast({ title: 'Presença Registrada', description: 'O membro foi marcado como presente.', variant: 'success' });
          }
          
          setMembers(prevMembers => 
            prevMembers.map(m => m.id === memberId ? { ...m, isPresent: !isPresent } : m)
          );
          
          await supabase.rpc('sync_attendance_records');

          if(onAttendanceChange) {
            onAttendanceChange();
          }

        } catch (error) {
          toast({ title: 'Erro ao atualizar presença', description: error.message, variant: 'destructive' });
        } finally {
          setProcessingMember(null);
        }
      };

      const filteredMembers = useMemo(() => {
        if (!searchTerm) return members;
        return members.filter(member => 
          member.codinome.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }, [members, searchTerm]);

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
        <Card className="glassmorphic mt-6">
          <CardHeader>
            <CardTitle>Lista de Chamada para {format(new Date(selectedDate.replace(/-/g, '/')), 'dd/MM/yyyy')}</CardTitle>
            <CardDescription>
              Clique nos botões para registrar ou remover a presença de um membro para a data selecionada.
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <AnimatePresence>
                {filteredMembers.length > 0 ? (
                    filteredMembers.map(member => (
                    <motion.div
                        key={member.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/30"
                    >
                        <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={member.avatar_url} alt={member.codinome} />
                            <AvatarFallback>{member.codinome.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="font-semibold text-foreground">{member.codinome}</span>
                            <span className="text-xs text-muted-foreground">{member.patente_atual}</span>
                        </div>
                        </div>
                        <Button
                        size="icon"
                        variant={member.isPresent ? 'success' : 'destructive'}
                        onClick={() => handleTogglePresence(member.id, member.isPresent)}
                        disabled={processingMember === member.id}
                        className="w-10 h-10 rounded-full transition-all duration-300"
                        >
                        {processingMember === member.id ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : member.isPresent ? (
                            <Check className="h-5 w-5" />
                        ) : (
                            <X className="h-5 w-5" />
                        )}
                        </Button>
                    </motion.div>
                    ))
                ) : (
                    <div className="col-span-full flex flex-col justify-center items-center h-64">
                        <UserX size={48} className="text-muted-foreground mb-4"/>
                        <p className="text-xl text-muted-foreground">Nenhum membro encontrado.</p>
                        <p className="text-sm text-muted-foreground">{searchTerm ? 'Tente um termo de busca diferente.' : 'Não há membros elegíveis para esta chamada.'}</p>
                    </div>
                )}
                </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      );
    };

    export default InteractiveAttendanceGrid;
  