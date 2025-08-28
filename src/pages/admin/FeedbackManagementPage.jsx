import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, CalendarCheck, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import MissionFeedbackPage from '@/components/admin/feedback/MissionFeedbackPage';
import GeneralFeedbackSummary from '@/components/admin/feedback/GeneralFeedbackSummary';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const FeedbackManagementPage = () => {
  const [activeTab, setActiveTab] = useState('by_event');

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-semibold text-foreground flex items-center">
          <MessageSquare className="mr-3 h-8 w-8 text-primary" /> Gerenciamento de Feedbacks
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-1/2">
          <TabsTrigger value="by_event" className="dashboard-tab-trigger">
            <CalendarCheck className="w-4 h-4 mr-2" />
            Feedback por Evento
          </TabsTrigger>
          <TabsTrigger value="general_summary" className="dashboard-tab-trigger">
            <Users className="w-4 h-4 mr-2" />
            Resumo Geral
          </TabsTrigger>
        </TabsList>
        <TabsContent value="by_event" className="mt-4">
           <motion.div
              key="by_event"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <MissionFeedbackPage />
            </motion.div>
        </TabsContent>
        <TabsContent value="general_summary" className="mt-4">
           <motion.div
              key="general_summary"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <GeneralFeedbackSummary />
            </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default FeedbackManagementPage;