import React from 'react';
import { motion } from 'framer-motion';
import StatCard from '@/components/member/StatCard';
import { ShieldCheck, CalendarDays, ShieldAlert, Coins, Award, Activity } from 'lucide-react';

const DashboardStatsGrid = ({ memberData, variants }) => {
  const totalAdvertencias = memberData.advertencias ? memberData.advertencias.length : 0;
  const memberCoins = memberData.coins || 0;
  const memberPoints = memberData.points || 0;
  const memberStatus = memberData.status || 'Indefinido';
  const isStatusActive = memberStatus.toLowerCase() === 'ativo';

  return (
    <motion.div 
      variants={variants}
      className="grid grid-cols-2 lg:grid-cols-6 gap-6 mb-8"
    >
      <StatCard title="Sua Patente" value={memberData.patente_atual || 'N/D'} icon={<ShieldCheck className="h-6 w-6 text-sky-400" />} />
      <StatCard title="Status" value={memberStatus} icon={<Activity className="h-6 w-6" />} valueClassName={isStatusActive ? 'text-green-400' : 'text-red-400'} />
      <StatCard title="Presenças" value={memberData.total_presencas || 0} icon={<CalendarDays className="h-6 w-6 text-green-400" />} />
      <StatCard title="Advertências" value={totalAdvertencias} icon={<ShieldAlert className={`h-6 w-6 ${totalAdvertencias > 0 ? 'text-destructive' : 'text-yellow-400'}`} />} />
      <StatCard title="Moedas" value={memberCoins} icon={<Coins className="h-6 w-6 text-yellow-500" />} />
      <StatCard title="Pontos" value={memberPoints} icon={<Award className="h-6 w-6 text-purple-400" />} />
    </motion.div>
  );
};

export default DashboardStatsGrid;