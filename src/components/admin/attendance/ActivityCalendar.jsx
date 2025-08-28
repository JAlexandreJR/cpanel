
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, getDaysInMonth, startOfMonth, getDay, isSameDay, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const ActivityCalendar = ({ data, month }) => {
  const monthDate = new Date(`${month}-01T12:00:00Z`);
  const monthName = format(monthDate, 'MMMM', { locale: ptBR });
  const year = format(monthDate, 'yyyy');

  const daysInMonth = getDaysInMonth(monthDate);
  const startDayOfMonth = getDay(startOfMonth(monthDate));

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: startDayOfMonth });

  const getStatusClasses = (status) => {
    switch (status) {
      case 'present': return 'bg-green-500/80 text-white hover:bg-green-400';
      case 'absent_justified': return 'bg-blue-500/80 text-white hover:bg-blue-400';
      case 'absent_unjustified': return 'bg-red-500/80 text-white hover:bg-red-400';
      default: return 'bg-muted/30 text-muted-foreground cursor-not-allowed';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'present': return 'Presente';
      case 'absent_justified': return 'Falta Justificada';
      case 'absent_unjustified': return 'Falta';
      default: return 'Sem dados';
    }
  };
  
  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  return (
    <Card className="glassmorphic h-full">
      <CardHeader>
        <CardTitle>Calendário de Atividades</CardTitle>
        <CardDescription>{`${monthName} de ${year}`}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground mb-2">
            {weekDays.map((day, i) => <div key={i}>{day}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {emptyDays.map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square rounded-full" />
          ))}
          {days.map(day => {
            const currentDate = startOfDay(new Date(year, monthDate.getMonth(), day));
            const dateString = format(currentDate, 'yyyy-MM-dd');
            const status = data[dateString] || 'future';
            const isToday = isSameDay(currentDate, new Date());
            return (
              <TooltipProvider key={day}>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        'flex items-center justify-center p-1 rounded-full aspect-square text-sm font-bold transition-all duration-200 ease-in-out transform hover:scale-110 shadow-sm',
                        getStatusClasses(status),
                        isToday && "ring-2 ring-primary ring-offset-2 ring-offset-card"
                      )}
                    >
                      {day}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{format(currentDate, 'dd/MM/yyyy')} - {getStatusText(status)}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
        <div className="flex justify-center items-center space-x-2 sm:space-x-4 mt-6 text-xs sm:text-sm">
            <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-green-500 mr-1.5"></div><span>Presente</span></div>
            <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-blue-500 mr-1.5"></div><span>Just.</span></div>
            <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-red-500 mr-1.5"></div><span>Falta</span></div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityCalendar;
