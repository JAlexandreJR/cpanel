
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, UserPlus, Search, ShieldPlus, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MemberFormDialog from '@/components/admin/MemberFormDialog';
import RecruitmentTabs from '@/components/admin/recruitment/RecruitmentTabs';
import RecruitmentTable from '@/components/admin/recruitment/RecruitmentTable';
import ApplicationDetailsDialog from '@/components/admin/recruitment/ApplicationDetailsDialog';
import ApproveRecruitDialog from '@/components/admin/recruitment/ApproveRecruitDialog';
import DeleteApplicationAlert from '@/components/admin/recruitment/DeleteApplicationAlert';
import DepartedMembersDialog from '@/components/admin/members/DepartedMembersDialog';

const RecruitmentManagementPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('TODOS');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isManualAddMemberOpen, setIsManualAddMemberOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isDepartedMembersDialogOpen, setIsDepartedMembersDialogOpen] = useState(false);


  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('applications')
      .select('*, recruited_by_user:users(nome)')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: "Erro ao buscar candidaturas", description: error.message, variant: "destructive" });
    } else {
      setApplications(data || []);
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchApplications();
    
    const channel = supabase.channel('realtime-applications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, () => {
        fetchApplications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchApplications]);

  useEffect(() => {
    let filtered = applications;
    if (activeTab !== 'TODOS') {
      filtered = filtered.filter(app => app.status === activeTab);
    }
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(app =>
        app.codinome?.toLowerCase().includes(lowerSearchTerm) ||
        app.discord_nick?.toLowerCase().includes(lowerSearchTerm) ||
        app.discord_id?.toLowerCase().includes(lowerSearchTerm)
      );
    }
    setFilteredApplications(filtered);
  }, [applications, activeTab, searchTerm]);

  const handleOpenModal = (app) => setSelectedApplication(app);
  const handleCloseModal = () => setSelectedApplication(null);
  
  const handleDeleteApplication = async () => {
    if (!selectedApplication) return;
    setIsProcessing(true);
    try {
        const { error } = await supabase
            .from('applications')
            .delete()
            .eq('id', selectedApplication.id);

        if (error) throw error;

        toast({ title: "Candidatura Excluída", description: `A candidatura de ${selectedApplication.codinome} foi removida.` });
        fetchApplications();
        handleCloseModal();
    } catch (error) {
        toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } finally {
        setIsProcessing(false);
        setIsDeleteAlertOpen(false);
    }
  };

  const handleConfirmApproval = async (email, password) => {
    if (!selectedApplication) return;
    setIsProcessing(true);
    try {
      const payload = {
        applicationId: selectedApplication.id,
        recruiterId: user.id,
        email: email,
        password: password,
      };

      const { data: functionResponse, error: functionError } = await supabase.functions.invoke('create-update-panel-user', {
        body: payload,
      });

      if (functionError) {
        let errorMsg = functionError.message;
        try {
          const errorBody = await functionError.context.json();
          if (errorBody && errorBody.error) {
            errorMsg = errorBody.error;
          }
        } catch(e) {
          // Ignore if cannot parse body
        }
        throw new Error(errorMsg);
      }
      
      if (functionResponse.error) throw new Error(functionResponse.error);
      
      toast({ title: "Recruta Aprovado!", description: `${selectedApplication.codinome} agora é um membro e tem acesso ao painel.` });
      
      const { error: discordError } = await supabase.functions.invoke('send-recruitment-to-discord', {
          body: { ...selectedApplication, recruiter_name: user.user_metadata.nome || user.email },
      });
      if (discordError) console.warn("Falha ao notificar Discord:", discordError);

      fetchApplications();
      handleCloseModal();
      setIsApproveDialogOpen(false);
    } catch (error) {
      toast({ title: "Erro ao aprovar", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateStatus = async (newStatus, notes, date) => {
    if (!selectedApplication) return;
    
    if (newStatus === 'ACEITO') {
      setIsApproveDialogOpen(true);
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('applications')
        .update({ 
          status: newStatus, 
          recruiter_notes: notes,
          interview_date: date ? new Date(date).toISOString() : null,
          recruited_by: user.id
        })
        .eq('id', selectedApplication.id);
      if (error) throw error;
      toast({ title: "Status Atualizado!", description: `Candidatura de ${selectedApplication.codinome} atualizada para ${newStatus}.` });
      
      fetchApplications();
      handleCloseModal();
    } catch (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 sm:p-6 space-y-6">
        <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-2xl sm:text-3xl font-bold text-primary flex items-center"><UserPlus className="mr-3" /> Gerenciamento de Recrutamento</CardTitle>
                <CardDescription className="text-muted-foreground">Analise, agende e aprove novos recrutas para o clã.</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button variant="outline" className="btn-outline-dark" onClick={() => setIsDepartedMembersDialogOpen(true)}>
                    <History className="mr-2 h-4 w-4" /> Histórico de Saídas
                </Button>
                <Button variant="outline" className="btn-outline-dark" onClick={() => setIsManualAddMemberOpen(true)}>
                    <ShieldPlus className="mr-2 h-4 w-4" /> Adicionar Membro Manualmente
                </Button>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Buscar por nick, Discord ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 input-dark"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <RecruitmentTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="shadow-lg">
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
                ) : (
                  <RecruitmentTable applications={filteredApplications} onOpenModal={handleOpenModal} />
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <DepartedMembersDialog
        isOpen={isDepartedMembersDialogOpen}
        onOpenChange={setIsDepartedMembersDialogOpen}
        onMemberRejoinedOrDeleted={fetchApplications}
      />

      <DeleteApplicationAlert
        isOpen={isDeleteAlertOpen}
        onOpenChange={setIsDeleteAlertOpen}
        application={selectedApplication}
        onConfirm={handleDeleteApplication}
        isProcessing={isProcessing}
      />

      <ApplicationDetailsDialog
        isOpen={!!selectedApplication && !isApproveDialogOpen}
        onOpenChange={handleCloseModal}
        application={selectedApplication}
        onUpdateStatus={handleUpdateStatus}
        onDelete={() => setIsDeleteAlertOpen(true)}
        isProcessing={isProcessing}
      />
      
      <MemberFormDialog
        isOpen={isManualAddMemberOpen}
        onOpenChange={setIsManualAddMemberOpen}
        onSave={fetchApplications}
        isManualAdd={true}
      />

      <ApproveRecruitDialog
        isOpen={isApproveDialogOpen}
        onOpenChange={setIsApproveDialogOpen}
        application={selectedApplication}
        onConfirm={handleConfirmApproval}
        isProcessing={isProcessing}
      />
    </>
  );
};

export default RecruitmentManagementPage;
