import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserPlus, Search, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UserManagementTable from '@/components/admin/UserManagementTable';
import UserManagementForm from '@/components/admin/UserManagementForm';
import UnlinkedMembersSection from '@/components/admin/UnlinkedMembersSection';
import DeleteUserDialog from '@/components/admin/DeleteUserDialog';

const UserManagementPage = () => {
  const { supabase, user } = useAuth();
  const { toast } = useToast();
  
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [membersWithoutPanelAccount, setMembersWithoutPanelAccount] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormProcessing, setIsFormProcessing] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const fetchPanelUsersAndUnlinkedMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: authUsersResponse, error: authUsersError } = await supabase.rpc('get_all_auth_users');
      if (authUsersError) throw authUsersError;
      
      const authUserMap = new Map((authUsersResponse || []).map(u => [u.id, u]));
      
      const { data: publicUsersData, error: publicUsersError } = await supabase.from('users').select('*');
      if (publicUsersError) throw publicUsersError;
      
      const { data: membersData, error: membersError } = await supabase.from('members').select('user_id, codinome, email');
      if (membersError) throw membersError;
      
      const memberMap = new Map((membersData || []).filter(m => m.user_id).map(m => [m.user_id, m]));

      const combinedUsers = (authUsersResponse || []).map(authUser => {
        const publicProfile = publicUsersData.find(p => p.id === authUser.id) || {};
        const memberProfile = memberMap.get(authUser.id) || {};
        return {
          id: authUser.id,
          email: authUser.email,
          role: publicProfile.role || authUser.role || 'member',
          nome: memberProfile.codinome || publicProfile.nome || authUser.email,
          public_profile: publicProfile,
          member_profile: memberProfile,
        };
      });

      setUsers(combinedUsers);
      setFilteredUsers(combinedUsers);

      const allMembers = await supabase.from('members').select('id, codinome, email, user_id').is('data_saida', null);
      if (allMembers.error) throw allMembers.error;
      
      const unlinked = (allMembers.data || []).filter(m => !m.user_id || !authUserMap.has(m.user_id));
      setMembersWithoutPanelAccount(unlinked || []);

    } catch (error) {
      toast({ title: "Erro ao buscar dados", description: `Falha ao carregar usuários e membros: ${error.message}`, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [supabase, toast]);


  useEffect(() => {
    fetchPanelUsersAndUnlinkedMembers();
  }, [fetchPanelUsersAndUnlinkedMembers]);

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filteredData = users.filter(item => 
      item.email?.toLowerCase().includes(lowercasedFilter) ||
      item.nome?.toLowerCase().includes(lowercasedFilter) ||
      item.role?.toLowerCase().includes(lowercasedFilter)
    );
    setFilteredUsers(filteredData);
  }, [searchTerm, users]);

  const openCreateForm = () => {
    setCurrentUser(null);
    setIsEditing(false);
    setIsFormOpen(true);
  };

  const openEditForm = (userToEdit) => {
    setCurrentUser(userToEdit);
    setIsEditing(true);
    setIsFormOpen(true);
  };
  
  const handleFormSubmit = async (formData) => {
    setIsFormProcessing(true);
    try {
      const { data: functionResponse, error: functionError } = await supabase.functions.invoke('create-update-panel-user', {
        body: {
          userId: formData.userId,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          nome: formData.nome,
        },
      });

      if (functionError) throw functionError;
      if (functionResponse.error) throw new Error(functionResponse.error);

      toast({ 
        title: `Usuário ${formData.userId ? 'Atualizado' : 'Criado'}!`, 
        description: `${functionResponse.message || (formData.userId ? `Usuário ${formData.email} atualizado.` : `Usuário ${formData.email} criado.`)}`, 
        variant: "default" 
      });
      
      setIsFormOpen(false);
      fetchPanelUsersAndUnlinkedMembers(); 
    } catch (err) {
      toast({ title: `Erro ao ${formData.userId ? 'atualizar' : 'criar'} usuário`, description: err.message, variant: "destructive" });
    } finally {
      setIsFormProcessing(false);
    }
  };

  const openDeleteDialog = (user) => {
    if (user.id === authUser.id) {
      toast({ title: "Ação não permitida", description: "Você não pode remover a sua própria conta.", variant: "destructive" });
      return;
    }
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsFormProcessing(true);
    try {
      const { data: deleteResponse, error: functionError } = await supabase.functions.invoke('create-update-panel-user', {
        body: { userIdToDelete: userToDelete.id },
      });
      
      if (functionError) throw functionError;
      if (deleteResponse.error) throw new Error(deleteResponse.error)

      toast({ title: "Usuário Removido", description: deleteResponse.message || `Usuário ${userToDelete.email} removido.`, variant: "default" });
      fetchPanelUsersAndUnlinkedMembers();
    } catch (err) {
      toast({ title: "Erro ao deletar usuário", description: err.message, variant: "destructive" });
    } finally {
      setIsFormProcessing(false);
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleLinkOrCreatePanelUserForMember = async (member, newEmailForMember) => {
    setIsLinking(true);
    
    const emailToUse = newEmailForMember || member.email;

    if (!emailToUse) {
      toast({ title: "Email Necessário", description: `Forneça um email para ${member.codinome} para criar/vincular conta.`, variant: "destructive" });
      setIsLinking(false);
      return;
    }

    try {
      const defaultPassword = `Gerr@${new Date().getFullYear()}!`; 
      const { data: functionData, error: functionError } = await supabase.functions.invoke('create-update-panel-user', {
          body: { 
            isManualAdd: true,
            memberData: {
              id: member.id,
              codinome: member.codinome,
              email: emailToUse,
              password: defaultPassword,
            }
          },
      });

      if (functionError) throw functionError;
      if (functionData.error) throw new Error(functionData.error);
      
      let toastMessage;
      if (functionData.message.includes("já existia")) {
        toastMessage = { title: "Vinculado!", description: `${member.codinome} vinculado à conta existente de ${emailToUse}.` };
      } else {
        toastMessage = { title: "Conta Criada e Vinculada!", description: `Conta para ${member.codinome} (${emailToUse}) criada. Senha padrão: ${defaultPassword}.`, duration: 10000 };
      }
      
      toast(toastMessage);
      fetchPanelUsersAndUnlinkedMembers();

    } catch (err) {
      toast({ title: "Erro na Operação", description: err.message, variant: "destructive" });
    } finally {
      setIsLinking(false);
    }
  };

  const authUser = useAuth().user;

  return (
    <motion.div 
      className="p-4 sm:p-6 space-y-6"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
    >
      <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl sm:text-3xl font-bold text-primary">Gerenciamento de Usuários do Painel</CardTitle>
              <CardDescription className="text-muted-foreground">Crie, edite e gerencie os usuários que acessam este painel.</CardDescription>
            </div>
            <Button onClick={openCreateForm} className="btn-primary-dark w-full sm:w-auto" disabled={isFormProcessing || isLinking}>
              <UserPlus className="mr-2 h-5 w-5" /> Criar Novo Usuário
            </Button>
          </div>
        </CardHeader>
      </Card>

      <AnimatePresence>
        <UserManagementForm
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleFormSubmit}
          isLoading={isFormProcessing}
          isEditing={isEditing}
          currentUserData={currentUser}
        />
      </AnimatePresence>
      
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl">Usuários com Acesso ao Painel</CardTitle>
           <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por email, nome ou role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input-dark"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && users.length === 0 && <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
          {!isLoading && filteredUsers.length === 0 && <p className="text-center text-muted-foreground py-10">Nenhum usuário encontrado.</p>}
          {filteredUsers.length > 0 && (
            <UserManagementTable 
              users={filteredUsers}
              onEdit={openEditForm}
              onDelete={openDeleteDialog}
              isLoading={isFormProcessing || isLinking}
              currentAuthUserId={authUser?.id}
            />
          )}
        </CardContent>
      </Card>

      <UnlinkedMembersSection
        members={membersWithoutPanelAccount}
        onLinkOrCreate={handleLinkOrCreatePanelUserForMember}
        isLoading={isLinking}
      />

      <DeleteUserDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        userEmail={userToDelete?.email}
        onConfirmDelete={handleDeleteUser}
        isLoading={isFormProcessing}
      />
    </motion.div>
  );
};

export default UserManagementPage;