import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, ShieldCheck, TrendingUp } from 'lucide-react';

const StatItem = ({ icon, label, value, color }) => (
  <div className="flex items-center justify-between p-3 bg-card/60 rounded-lg">
    <div className="flex items-center">
      {React.cloneElement(icon, { className: `h-6 w-6 mr-3 ${color}` })}
      <span className="text-muted-foreground">{label}</span>
    </div>
    <span className="font-bold text-lg text-primary-foreground">{value}</span>
  </div>
);

const AttendanceStats = ({ data }) => {
  const stats = useMemo(() => {
    const totalDays = Object.keys(data).filter(d => data[d] !== 'future').length;
    const presentDays = Object.values(data).filter(s => s === 'present').length;
    const justifiedAbsences = Object.values(data).filter(s => s === 'absent_justified').length;
    const unjustifiedAbsences = Object.values(data).filter(s => s === 'absent_unjustified').length;
    
    const percentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    return {
      totalDays,
      presentDays,
      justifiedAbsences,
      unjustifiedAbsences,
      percentage: Math.round(percentage)
    };
  }, [data]);

  return (
    <Card className="glassmorphic h-full">
      <CardHeader>
        <CardTitle>Estatísticas do Mês</CardTitle>
        <CardDescription>Resumo da frequência do membro no período selecionado.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-primary flex items-center"><TrendingUp className="mr-2 h-5 w-5" />Frequência</span>
                <span className="text-xl font-bold text-primary">{stats.percentage}%</span>
            </div>
            <Progress value={stats.percentage} className="w-full h-3" indicatorClassName="bg-primary" />
        </div>
        
        <div className="space-y-3 pt-2">
            <StatItem icon={<CheckCircle />} label="Presenças" value={stats.presentDays} color="text-green-400" />
            <StatItem icon={<ShieldCheck />} label="Faltas Justificadas" value={stats.justifiedAbsences} color="text-blue-400" />
            <StatItem icon={<XCircle />} label="Faltas Não Justificadas" value={stats.unjustifiedAbsences} color="text-red-400" />
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceStats;