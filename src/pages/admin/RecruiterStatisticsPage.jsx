import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, UserPlus, Calendar, BarChart3, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const RecruiterStatisticsPage = () => {
    const { user, userRole } = useAuth();
    const { toast } = useToast();
    const [stats, setStats] = useState([]);
    const [personalStats, setPersonalStats] = useState({ count: 0, last_recruitment: 'N/A' });
    const [recruitsList, setRecruitsList] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('applications')
                .select('created_at, recruited_by, recruiter:users!applications_recruited_by_fkey(email, nome), codinome')
                .eq('status', 'ACEITO')
                .not('recruited_by', 'is', null);

            if (error) throw error;
            
            if (userRole === 'admin') {
                const groupedStats = data.reduce((acc, curr) => {
                    const recruiterName = curr.recruiter?.nome || curr.recruiter?.email || 'Desconhecido';
                    if (!acc[recruiterName]) {
                        acc[recruiterName] = { count: 0, recruits: [] };
                    }
                    acc[recruiterName].count += 1;
                    acc[recruiterName].recruits.push(curr.codinome);
                    return acc;
                }, {});

                const chartData = Object.entries(groupedStats).map(([name, data]) => ({ 
                    name, 
                    recrutamentos: data.count,
                    recrutados: data.recruits.join(', ')
                }));
                setStats(chartData);
            } else if (userRole === 'recrutador') {
                const userRecruits = data.filter(d => d.recruited_by === user.id);
                userRecruits.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

                setPersonalStats({
                    count: userRecruits.length,
                    last_recruitment: userRecruits.length > 0 ? new Date(userRecruits[0].created_at).toLocaleDateString('pt-BR') : 'N/A'
                });
                setRecruitsList(userRecruits);
            }

        } catch (error) {
            console.error("Erro detalhado:", error);
            toast({ title: 'Erro ao buscar estatísticas', description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [user, userRole, toast]);

    useEffect(() => {
        if(user) {
            fetchStats();
        }
    }, [fetchStats, user]);
    
    const CustomTooltip = ({ active, payload, label }) => {
      if (active && payload && payload.length) {
        return (
          <div className="p-3 bg-card/90 backdrop-blur-sm border border-border rounded-lg shadow-lg">
            <p className="label text-primary font-semibold">{label}</p>
            <p className="intro text-foreground">{`Recrutamentos: ${payload[0].value}`}</p>
            <p className="text-xs text-muted-foreground mt-2">Recrutados: {payload[0].payload.recrutados}</p>
          </div>
        );
      }
      return null;
    };

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 md:p-6 space-y-6">
            <Card className="glassmorphic-dark border-primary/40">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold text-primary flex items-center">
                        <BarChart3 className="mr-3 h-8 w-8" />
                        Estatísticas de Recrutamento
                    </CardTitle>
                    <CardDescription>
                        {userRole === 'admin' ? 'Desempenho de todos os recrutadores.' : 'Seu desempenho como recrutador.'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {userRole === 'admin' && (
                        <div style={{ width: '100%', height: 400 }}>
                           {stats.length > 0 ? (
                            <ResponsiveContainer>
                                <BarChart data={stats} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                                    <XAxis dataKey="name" stroke="#9ca3af" />
                                    <YAxis stroke="#9ca3af" allowDecimals={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ color: '#d1d5db' }}/>
                                    <Bar dataKey="recrutamentos" fill="hsl(var(--primary))" name="Recrutamentos" />
                                </BarChart>
                            </ResponsiveContainer>
                           ) : (
                               <div className="flex flex-col items-center justify-center h-full text-center">
                                   <UserPlus size={48} className="text-muted-foreground mb-4"/>
                                   <p className="text-lg text-muted-foreground">Nenhum dado de recrutamento encontrado.</p>
                                   <p className="text-sm text-muted-foreground">Ainda não há recrutas aprovados no sistema.</p>
                               </div>
                           )}
                        </div>
                    )}
                    {userRole === 'recrutador' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                           <Card className="bg-background/30 lg:col-span-1">
                               <CardHeader className="flex flex-row items-center justify-between pb-2">
                                   <CardTitle className="text-sm font-medium">Total de Recrutados</CardTitle>
                                   <UserPlus className="h-6 w-6 text-primary" />
                               </CardHeader>
                               <CardContent>
                                   <div className="text-4xl font-bold text-primary">{personalStats.count}</div>
                                   <p className="text-xs text-muted-foreground">Membros aceitos por você.</p>
                               </CardContent>
                           </Card>
                           <Card className="bg-background/30 lg:col-span-1">
                               <CardHeader className="flex flex-row items-center justify-between pb-2">
                                   <CardTitle className="text-sm font-medium">Último Recrutamento</CardTitle>
                                   <Calendar className="h-6 w-6 text-primary" />
                               </CardHeader>
                               <CardContent>
                                   <div className="text-4xl font-bold text-primary">{personalStats.last_recruitment}</div>
                                   <p className="text-xs text-muted-foreground">Data do último membro aceito.</p>
                               </CardContent>
                           </Card>
                           <Card className="lg:col-span-3 bg-background/30">
                               <CardHeader>
                                   <CardTitle className="text-xl flex items-center"><UserCheck className="mr-2 h-5 w-5 text-primary"/>Seus Recrutas Aprovados</CardTitle>
                               </CardHeader>
                               <CardContent>
                                   {recruitsList.length > 0 ? (
                                       <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                           {recruitsList.map((recruit, index) => (
                                               <li key={index} className="flex justify-between items-center bg-secondary/30 p-2 rounded-md">
                                                   <span className="font-medium text-foreground">{recruit.codinome}</span>
                                                   <span className="text-sm text-muted-foreground">{new Date(recruit.created_at).toLocaleDateString('pt-BR')}</span>
                                               </li>
                                           ))}
                                       </ul>
                                   ) : (
                                       <p className="text-muted-foreground">Você ainda não recrutou nenhum membro.</p>
                                   )}
                               </CardContent>
                           </Card>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default RecruiterStatisticsPage;