import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Loader2, ThumbsUp, ThumbsDown, Meh, Search, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

const GeneralFeedbackSummary = () => {
  const { supabase } = useAuth();
  const { toast } = useToast();
  const [feedbackData, setFeedbackData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchFeedbackData = async () => {
      setLoading(true);
      try {
        const { data: members, error: membersError } = await supabase
          .from('members')
          .select('id, codinome, patente_atual, status')
          .in('status', ['Ativo', 'Inativo', 'Licença']);

        if (membersError) throw membersError;

        const { data: feedbacks, error: feedbacksError } = await supabase
          .from('mission_feedback')
          .select('evaluated_member_id, feedback_type');

        if (feedbacksError) throw feedbacksError;

        const feedbackSummary = members.map(member => {
          const memberFeedbacks = feedbacks.filter(fb => fb.evaluated_member_id === member.id);
          return {
            ...member,
            positivo: memberFeedbacks.filter(fb => fb.feedback_type === 'Positivo').length,
            neutro: memberFeedbacks.filter(fb => fb.feedback_type === 'Neutro').length,
            negativo: memberFeedbacks.filter(fb => fb.feedback_type === 'Negativo').length,
          };
        });

        setFeedbackData(feedbackSummary);
      } catch (error) {
        toast({
          title: "Erro ao carregar resumo",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbackData();
  }, [supabase, toast]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return feedbackData;
    return feedbackData.filter(member =>
      member.codinome.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, feedbackData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="ml-3 text-muted-foreground">Carregando resumo de feedbacks...</p>
      </div>
    );
  }

  return (
    <Card className="glassmorphic">
      <CardHeader>
        <CardTitle>Resumo Geral de Feedbacks</CardTitle>
        <CardDescription>Contagem de feedbacks positivos, neutros e negativos para cada membro ativo.</CardDescription>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por codinome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 input-dark w-full md:w-1/3"
          />
        </div>
      </CardHeader>
      <CardContent>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="overflow-x-auto"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><User className="inline-block h-4 w-4 mr-1" />Membro</TableHead>
                <TableHead className="text-center"><ThumbsUp className="inline-block h-4 w-4 mr-1 text-green-500" />Positivos</TableHead>
                <TableHead className="text-center"><Meh className="inline-block h-4 w-4 mr-1 text-yellow-500" />Neutros</TableHead>
                <TableHead className="text-center"><ThumbsDown className="inline-block h-4 w-4 mr-1 text-red-500" />Negativos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map(member => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className="text-primary-foreground">{member.codinome}</span>
                        <span className="text-xs text-muted-foreground">{member.patente_atual}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="success" className="text-lg">{member.positivo}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="warning" className="text-lg">{member.neutro}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="destructive" className="text-lg">{member.negativo}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Nenhum membro encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </motion.div>
      </CardContent>
    </Card>
  );
};

export default GeneralFeedbackSummary;