
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { YES_NO_OPTIONS_VALUES, formatDateForInput } from './utils';

const getInitialFormData = () => ({
  codinome: '',
  discord_id: '',
  email: '',
  password: '',
  patente_atual: 'Reservista',
  status: 'Ativo',
  jogo_principal: 'Squad',
  data_ingresso: formatDateForInput(new Date().toISOString()),
  total_presencas: 0,
  observacoes_saida: '',
  ultima_presenca: '',
  penultima_presenca: '',
  esa: YES_NO_OPTIONS_VALUES.NOT_DEFINED,
  cfo: YES_NO_OPTIONS_VALUES.NOT_DEFINED,
  promocao_status: '',
  data_saida: '',
  advertencias: [],
});

export const useMemberFormLogic = ({ member, isOpen, onSave, onOpenChange, isManualAdd }) => {
  const { supabase } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState(getInitialFormData());
  const [isLoading, setIsLoading] = useState(false);
  
  const isEditing = useMemo(() => !!member, [member]);
  const isManualAddMode = useMemo(() => isManualAdd || !isEditing, [isManualAdd, isEditing]);

  useEffect(() => {
    if (isOpen) {
      if (member) {
        setFormData({
          codinome: member.codinome || '',
          discord_id: member.discord_id || '',
          email: member.email || '',
          password: '',
          patente_atual: member.patente_atual || 'Reservista',
          status: member.status || 'Ativo',
          jogo_principal: member.jogo_principal || 'Squad',
          data_ingresso: member.data_ingresso ? formatDateForInput(member.data_ingresso) : formatDateForInput(new Date().toISOString()),
          total_presencas: member.total_presencas || 0,
          observacoes_saida: member.observacoes_saida || '',
          ultima_presenca: member.ultima_presenca ? formatDateForInput(member.ultima_presenca) : '',
          penultima_presenca: member.penultima_presenca ? formatDateForInput(member.penultima_presenca) : '',
          esa: member.esa || YES_NO_OPTIONS_VALUES.NOT_DEFINED,
          cfo: member.cfo || YES_NO_OPTIONS_VALUES.NOT_DEFINED,
          promocao_status: member.promocao_status || '',
          data_saida: member.data_saida ? formatDateForInput(member.data_saida) : '',
          advertencias: Array.isArray(member.advertencias) ? member.advertencias : [],
        });
      } else {
        setFormData(getInitialFormData());
      }
    }
  }, [member, isOpen]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSelectChange = useCallback((name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (isManualAddMode) {
      if (!formData.codinome || !formData.discord_id || !formData.email || !formData.password) {
        toast({ title: 'Campos Obrigatórios', description: 'Codinome, Discord ID, Email e Senha são obrigatórios.', variant: 'destructive' });
        setIsLoading(false);
        return;
      }
    } else {
      if (!formData.codinome || !formData.discord_id) {
        toast({ title: 'Campos Obrigatórios', description: 'Codinome e Discord ID são obrigatórios.', variant: 'destructive' });
        setIsLoading(false);
        return;
      }
    }

    try {
      const payload = {
        isManualAdd: isManualAddMode,
        memberData: isManualAddMode ? { ...formData } : { id: member?.id, ...formData },
      };

      const { data: functionData, error: functionError } = await supabase.functions.invoke('create-update-panel-user', {
        body: payload,
      });

      if (functionError) {
        let errorMsg = functionError.message;
        try {
          const errorBody = await functionError.context?.json();
          if (errorBody && errorBody.error) {
            errorMsg = errorBody.error;
          }
        } catch(err) {
          // Ignora se não conseguir parsear o corpo do erro
        }
        throw new Error(errorMsg);
      }
      
      if (functionData && functionData.error) throw new Error(functionData.error);

      toast({ 
        title: 'Sucesso!', 
        description: functionData.message,
      });
      onSave();
      onOpenChange(false);
    } catch (err) {
      console.error('Erro ao salvar membro:', err);
      toast({ title: 'Erro ao Salvar', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formData,
    setFormData,
    isLoading,
    setIsLoading,
    isManualAddMode,
    isEditing,
    handleChange,
    handleSelectChange,
    handleSubmit,
  };
};