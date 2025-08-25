
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useMemberFormLogic } from '@/components/admin/members/MemberFormLogic';
import MemberFormFields from '@/components/admin/members/MemberFormFields';
import MemberFormWarnings from '@/components/admin/members/MemberFormWarnings';
import MemberFormActions from '@/components/admin/members/MemberFormActions';
import AddWarningDialog from '@/components/admin/AddWarningDialog';

const MemberFormDialog = ({
  isOpen,
  onOpenChange,
  member,
  onSave,
  onMarkAsLeft,
  isManualAdd = false,
}) => {
  const {
    formData,
    setFormData,
    isLoading,
    setIsLoading,
    isManualAddMode,
    isEditing,
    handleSelectChange,
    handleChange,
    handleSubmit,
  } = useMemberFormLogic({ member, isOpen, onSave, onOpenChange, isManualAdd });
  
  const [isWarningDialogOpen, setIsWarningDialogOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsLoading(false);
    }
  }, [isOpen, setIsLoading]);

  const handleSaveWarning = (newWarning) => {
    const newWarningWithAuthor = {
      ...newWarning,
      responsavel: 'Admin', // Placeholder, should get from auth context
      data: new Date().toISOString(),
    };
    const updatedWarnings = [...(formData.advertencias || []), newWarningWithAuthor];
    setFormData((prev) => ({ ...prev, advertencias: updatedWarnings }));
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!isLoading) onOpenChange(open);
        }}
      >
        <DialogContent className="sm:max-w-2xl md:max-w-3xl bg-card border-primary/30 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-primary">
              {isEditing ? 'Editar Membro' : 'Adicionar Novo Membro'}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Atualize os dados do membro e gerencie advertências.'
                : 'Preencha os dados do perfil e as credenciais de acesso do novo membro.'}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto pr-2">
            <form onSubmit={handleSubmit} className="py-4 space-y-6">
              <MemberFormFields
                formData={formData}
                handleChange={handleChange}
                handleSelectChange={handleSelectChange}
                isManualAddMode={isManualAddMode}
                isEditing={isEditing}
              />

              {isEditing && (
                <MemberFormWarnings 
                  advertencias={formData.advertencias}
                  onAddWarning={() => setIsWarningDialogOpen(true)}
                />
              )}

              <MemberFormActions
                isEditing={isEditing}
                isLoading={isLoading}
                onCancel={() => onOpenChange(false)}
                onMarkAsLeft={onMarkAsLeft}
                isManualAddMode={isManualAddMode}
              />
            </form>
          </div>
        </DialogContent>
      </Dialog>
      {isEditing && (
        <AddWarningDialog
          isOpen={isWarningDialogOpen}
          onOpenChange={setIsWarningDialogOpen}
          onSave={handleSaveWarning}
        />
      )}
    </>
  );
};

export default MemberFormDialog;