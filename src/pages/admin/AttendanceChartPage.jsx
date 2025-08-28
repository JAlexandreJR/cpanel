import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart2, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MemberAttendanceChart from '@/components/admin/attendance/MemberAttendanceChart';
import { format, subMonths } from 'date-fns';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const AttendanceChartPage = () => {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  const monthOptions = useMemo(() => 
    Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(new Date(), i);
      return {
        value: format(date, 'yyyy-MM'),
        label: format(date, 'MMMM \'de\' yyyy'),
      };
    }), []);

  return (
    <motion.div initial="hidden" animate="visible" variants={cardVariants} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-semibold text-foreground flex items-center">
          <BarChart2 className="mr-3 h-8 w-8 text-primary" /> Gráfico de Frequência Geral
        </h1>
      </div>
      
      <Card className="glassmorphic">
        <CardHeader>
          <CardTitle>Filtros do Gráfico</CardTitle>
          <CardDescription>Selecione um mês para visualizar a frequência dos membros.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="max-w-xs">
                <label htmlFor="month-select" className="text-sm font-medium text-muted-foreground flex items-center mb-2">
                    <Calendar className="mr-2 h-4 w-4"/>
                    Mês do Relatório
                </label>
                <Select onValueChange={setSelectedMonth} value={selectedMonth}>
                <SelectTrigger id="month-select">
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
      
      <MemberAttendanceChart selectedMonth={selectedMonth} />

    </motion.div>
  );
};

export default AttendanceChartPage;