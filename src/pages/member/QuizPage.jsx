import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertTriangle, ChevronLeft, Award, RotateCw } from 'lucide-react';
import QuizSetup from '@/components/member/quiz/QuizSetup';
import QuizContent from '@/components/member/quiz/QuizContent';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { GENERAL_RANKS } from '@/components/admin/members/utils';

const QuizPage = () => {
    const { supabase, user, userRole } = useAuth();
    const { toast } = useToast();

    const [status, setStatus] = useState('loading');
    const [memberData, setMemberData] = useState(null);
    const [quizConfig, setQuizConfig] = useState(null);
    const [isGeneral, setIsGeneral] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const checkEligibility = useCallback(async () => {
        if (!user || !supabase) {
            setStatus('error');
            setErrorMessage('Usuário não autenticado.');
            return;
        }
        
        setStatus('loading');
        setErrorMessage('');

        try {
            const { data: member, error: memberError } = await supabase
                .from('members')
                .select('id, patente_atual, user_id, email, coins, points')
                .eq('user_id', user.id)
                .single();

            if (memberError || !member) {
                throw new Error("Não foi possível encontrar seus dados de membro. Tente novamente mais tarde.");
            }
            setMemberData(member);

            const userIsAdmin = userRole === 'admin';
            const userIsGeneral = GENERAL_RANKS.includes(member.patente_atual);
            setIsAdmin(userIsAdmin);
            setIsGeneral(userIsGeneral);

            if (userIsAdmin && !userIsGeneral) {
                setStatus('setup'); // Admins (not generals) get the filter view
            } else { // Generals and Regular members
                let query = supabase.from('quiz_questions').select('id', { count: 'exact', head: true });
                let attemptsQuery = supabase.from('quiz_attempts').select('question_id', { count: 'exact', head: true }).eq('member_id', member.id);

                if (!userIsGeneral) {
                    // Regular member: filter by current patent
                    query = query.eq('required_patente', member.patente_atual);
                    attemptsQuery = attemptsQuery.eq('patente_at_attempt', member.patente_atual);
                }
                
                const { count: availableCount, error: questionsError } = await query;
                if (questionsError) throw questionsError;

                const { count: answeredCount, error: attemptsError } = await attemptsQuery;
                if (attemptsError) throw attemptsError;
                
                if (availableCount === 0 || (availableCount > 0 && answeredCount >= availableCount)) {
                    setStatus('completed');
                } else {
                    setStatus('playing');
                }
            }
        } catch (e) {
            setErrorMessage(e.message);
            setStatus('error');
            toast({ title: "Erro de Elegibilidade", description: e.message, variant: "destructive" });
        }
    }, [user, supabase, toast, userRole]);

    useEffect(() => {
        checkEligibility();
    }, [checkEligibility]);

    const handleStartQuiz = (config) => {
        setQuizConfig(config);
        setStatus('playing');
    };

    const handleQuizFinish = () => {
        setQuizConfig(null);
        checkEligibility();
    };

    const handleResetAttempts = async () => {
        if (!memberData) return;
        setIsResetting(true);
        try {
            const { error } = await supabase
                .from('quiz_attempts')
                .delete()
                .eq('member_id', memberData.id);

            if (error) throw error;
            toast({ title: "Quiz Reiniciado!", description: "Seu progresso foi zerado. Prepare-se para um novo desafio." });
            checkEligibility();

        } catch (e) {
            toast({ title: "Erro ao Reiniciar", description: e.message, variant: "destructive"});
        } finally {
            setIsResetting(false);
        }
    };
    
    const renderContent = () => {
        switch (status) {
            case 'loading':
                return (
                    <div className="flex flex-col items-center justify-center h-full">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="mt-4 text-muted-foreground">Verificando sua elegibilidade para o quiz...</p>
                    </div>
                );
            case 'error':
                return (
                    <div className="text-center p-8 bg-card rounded-xl shadow-lg border border-destructive">
                        <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
                        <h2 className="mt-4 text-xl font-semibold text-destructive-foreground">Ocorreu um Erro</h2>
                        <p className="mt-2 text-muted-foreground">{errorMessage}</p>
                        <Button onClick={checkEligibility} className="mt-6">Tentar Novamente</Button>
                    </div>
                );
            case 'completed':
                const regularMessage = `Você já respondeu todas as perguntas para a sua patente atual: ${memberData?.patente_atual}. Você poderá realizar o quiz novamente assim que for promovido. Continue se esforçando!`;
                
                return (
                    <div className="text-center p-8 bg-card rounded-xl shadow-lg border border-yellow-500/50">
                        <Award className="mx-auto h-12 w-12 text-yellow-400" />
                        <h2 className="mt-4 text-xl font-semibold text-foreground">Desafio Concluído!</h2>
                        {isGeneral ? (
                            <>
                                <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                                    Parabéns, General! Você zerou todas as perguntas disponíveis. O conhecimento é uma arma que nunca enferruja.
                                </p>
                                <Button onClick={handleResetAttempts} className="mt-6" disabled={isResetting}>
                                    {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCw className="mr-2 h-4 w-4" />}
                                    Repetir o Quiz
                                </Button>
                            </>
                        ) : (
                             <p className="mt-2 text-muted-foreground max-w-md mx-auto">{regularMessage}</p>
                        )}
                    </div>
                );
            case 'setup':
                return <QuizSetup onStart={handleStartQuiz} />;
            case 'playing':
                return (
                    <QuizContent
                        config={quizConfig}
                        onFinish={handleQuizFinish}
                        memberData={memberData}
                        setMemberData={setMemberData}
                        isGeneral={isGeneral}
                        isAdmin={isAdmin}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-slate-900 to-background flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-4xl mx-auto"
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={status}
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        transition={{ duration: 0.3 }}
                    >
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </motion.div>
             <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="mt-8"
            >
               {status !== 'playing' && (
                <Button asChild variant="link" className="text-primary-light hover:text-primary transition-colors text-lg">
                    <Link to="/dashboard"><ChevronLeft className="mr-2 h-4 w-4" /> Voltar ao Painel</Link>
                </Button>
               )}
            </motion.div>
        </div>
    );
};

export default QuizPage;
