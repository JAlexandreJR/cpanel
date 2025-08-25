import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, HelpCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import QuestionFlow from './QuestionFlow';

const QuizContent = ({ config, onFinish, memberData, setMemberData, isGeneral, isAdmin }) => {
  const { supabase } = useAuth();
  const { toast } = useToast();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('quiz_questions').select('*');
      
      const { data: answeredQuestionsData, error: answeredError } = await supabase
        .from('quiz_attempts')
        .select('question_id')
        .eq('member_id', memberData.id);

      if (answeredError) throw answeredError;
      
      const answeredQuestionIds = answeredQuestionsData.map(a => a.question_id);
      
      if (isAdmin && !isGeneral && config) {
        // Admin with filters
        if (config.category !== 'all') {
          query = query.eq('category', config.category);
        }
        if (config.difficulty !== 'all') {
          query = query.eq('difficulty', config.difficulty);
        }
        query = query.limit(config.numQuestions);
      } else if (isGeneral) {
        // General: all questions not yet answered
        if (answeredQuestionIds.length > 0) {
          query = query.not('id', 'in', `(${answeredQuestionIds.join(',')})`);
        }
      } else {
        // Regular member: questions for their patent not yet answered
        query = query.eq('required_patente', memberData.patente_atual);
        if (answeredQuestionIds.length > 0) {
          query = query.not('id', 'in', `(${answeredQuestionIds.join(',')})`);
        }
      }

      const { data, error: questionsError } = await query;
      if (questionsError) throw questionsError;

      if (data && data.length > 0) {
        const questionsWithShuffledOptions = data.map(q => ({
          ...q,
          options: [...q.options].sort(() => Math.random() - 0.5)
        }));
        setQuestions(questionsWithShuffledOptions);
      } else {
        setQuestions([]);
      }
    } catch (err) {
      setError(err.message);
      toast({ title: "Erro ao carregar perguntas", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [supabase, toast, config, memberData, isGeneral, isAdmin]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="mt-3 text-slate-300">Carregando Desafio...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <HelpCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-destructive text-lg">{error}</p>
        <Button onClick={fetchQuestions} className="mt-6">Tentar Novamente</Button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-10">
        <Lock className="h-20 w-20 text-slate-500 mx-auto mb-4" />
        <h3 className="text-2xl font-semibold text-slate-400 mb-3">Quiz Indisponível</h3>
        <p className="text-slate-300 mb-6">
          {isAdmin && !isGeneral 
            ? "Nenhuma pergunta encontrada com os filtros selecionados."
            : isGeneral
              ? "Parabéns, General! Você zerou todas as perguntas disponíveis."
              : `Você já respondeu todas as perguntas disponíveis para sua patente (${memberData.patente_atual}). Aguarde a próxima promoção!`}
        </p>
        <Button onClick={onFinish} className="mt-6">Voltar</Button>
      </div>
    );
  }

  return (
    <QuestionFlow
      questions={questions}
      memberData={memberData}
      setMemberData={setMemberData}
      onFinish={onFinish}
    />
  );
};

export default QuizContent;