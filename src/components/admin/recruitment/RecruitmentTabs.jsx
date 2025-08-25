import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const statusConfig = {
  'TODOS': { label: 'Todos' },
  'EM ANÁLISE': { label: 'Em Análise' },
  'ACEITO-RECRUTAMENTO': { label: 'Agendado' },
  'ACEITO': { label: 'Aceito (Membro)' },
  'RECUSADO': { label: 'Recusado' },
};

const RecruitmentTabs = ({ activeTab, setActiveTab }) => {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
        {Object.entries(statusConfig).map(([status, { label }]) => (
          <TabsTrigger key={status} value={status}>{label}</TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};

export default RecruitmentTabs;
