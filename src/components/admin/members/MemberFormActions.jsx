
import React from 'react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Loader2, UserX, CheckCircle } from 'lucide-react';

const MemberFormActions = ({ isEditing, isLoading, onCancel, onMarkAsLeft, isManualAddMode }) => {
  return (
    <DialogFooter className="pt-8 flex flex-col sm:flex-row sm:justify-between items-center w-full gap-2 sticky bottom-0 bg-card pb-6 px-0 -mx-0">
      <div className="w-full sm:w-auto">
        {isEditing && (
          <Button
            type="button"
            variant="destructive"
            onClick={onMarkAsLeft}
            className="w-full sm:w-auto btn-destructive-dark"
            disabled={isLoading}
          >
            <UserX className="mr-2 h-4 w-4" /> Registrar Saída
          </Button>
        )}
      </div>
      <div className="flex gap-2 w-full sm:w-auto">
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto btn-secondary-dark"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="w-full sm:w-auto btn-primary"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            isManualAddMode ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" /> Adicionar Membro
              </>
            ) : (
              'Salvar Alterações'
            )
          )}
        </Button>
      </div>
    </DialogFooter>
  );
};

export default MemberFormActions;