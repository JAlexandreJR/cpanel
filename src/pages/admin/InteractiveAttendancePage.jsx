import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Hand, Calendar as CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InteractiveAttendanceGrid from '@/components/admin/attendance/InteractiveAttendanceGrid';
import { format } from 'date-fns';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const InteractiveAttendancePage = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  return (
    <motion.div initial="hidden" animate="visible" variants={cardVariants} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-semibold text-foreground flex items-center">
          <Hand className="mr-3 h-8 w-8 text-primary" /> Chamada Interativa
        </h1>
      </div>
      
      <Card className="glassmorphic">
        <CardHeader>
          <CardTitle>Controle de Presença</CardTitle>
          <CardDescription>Selecione uma data para visualizar e gerenciar a presença dos membros.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="max-w-xs">
                <Label htmlFor="date-select" className="text-sm font-medium text-muted-foreground flex items-center mb-2">
                    <CalendarIcon className="mr-2 h-4 w-4"/>
                    Data da Chamada
                </Label>
                <Input
                  id="date-select"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="input-dark"
                />
            </div>
        </CardContent>
      </Card>
      
      {selectedDate && <InteractiveAttendanceGrid selectedDate={selectedDate} />}

    </motion.div>
  );
};

export default InteractiveAttendancePage;