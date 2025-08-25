
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PATENTE_OPTIONS, STATUS_OPTIONS, JOGO_PRINCIPAL_OPTIONS, YES_NO_OPTIONS } from './utils';
import { useAuth } from '@/contexts/AuthContext';

const MemberFormFields = ({ formData, handleChange, handleSelectChange, isManualAddMode, isEditing }) => {
  const { userRole } = useAuth();
  const canEditPassword = isEditing && (userRole === 'admin' || userRole === 'moderador');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
      <div>
        <Label htmlFor="codinome" className="text-muted-foreground">Nome (Codinome)</Label>
        <Input id="codinome" name="codinome" value={formData.codinome} onChange={handleChange} className="input-dark mt-1" required placeholder="Codinome" />
      </div>
      <div>
        <Label htmlFor="discord_id" className="text-muted-foreground">Discord ID</Label>
        <Input id="discord_id" name="discord_id" value={formData.discord_id} onChange={handleChange} className="input-dark mt-1" required placeholder="ID Discord" />
      </div>
      
      {isManualAddMode ? (
        <>
           <div className="md:col-span-1">
             <Label htmlFor="email" className="text-muted-foreground">Email (Login do Painel)</Label>
             <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className="input-dark mt-1" required placeholder="email.login@exemplo.com" />
           </div>
           <div className="md:col-span-1">
             <Label htmlFor="password">Senha do Painel</Label>
             <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} className="input-dark mt-1" required placeholder="••••••••" />
           </div>
        </>
      ) : (
        isEditing && (
          <div className="md:col-span-2">
            <Label htmlFor="email" className="text-muted-foreground">Email (Login do Painel)</Label>
            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className="input-dark mt-1" disabled title="O email não pode ser alterado após a criação." />
          </div>
        )
      )}

      {canEditPassword && (
        <div className="md:col-span-2">
          <Label htmlFor="password">Nova Senha (Opcional)</Label>
          <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} className="input-dark mt-1" placeholder="Deixe em branco para não alterar" />
           <p className="text-xs text-muted-foreground mt-1">
            Preencha este campo para redefinir a senha do membro.
          </p>
        </div>
      )}

      <div>
        <Label htmlFor="ultima_presenca" className="text-muted-foreground">Última Presença</Label>
        <Input id="ultima_presenca" name="ultima_presenca" type="date" value={formData.ultima_presenca} onChange={handleChange} className="input-dark mt-1" />
      </div>
      <div>
        <Label htmlFor="total_presencas" className="text-muted-foreground">Total de Presenças</Label>
        <Input id="total_presencas" name="total_presencas" type="number" min="0" value={formData.total_presencas} onChange={handleChange} className="input-dark mt-1" placeholder="0" />
      </div>
      <div>
        <Label htmlFor="penultima_presenca" className="text-muted-foreground">Penúltima Presença</Label>
        <Input id="penultima_presenca" name="penultima_presenca" type="date" value={formData.penultima_presenca} onChange={handleChange} className="input-dark mt-1" />
      </div>
      <div>
        <Label htmlFor="status" className="text-muted-foreground">Status</Label>
        <Select name="status" value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
          <SelectTrigger className="input-dark mt-1"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>{STATUS_OPTIONS.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="esa" className="text-muted-foreground">Curso CIB (ESA)</Label>
        <Select name="esa" value={formData.esa} onValueChange={(value) => handleSelectChange('esa', value)}>
          <SelectTrigger className="input-dark mt-1"><SelectValue placeholder="Sim/Não" /></SelectTrigger>
          <SelectContent>{YES_NO_OPTIONS.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="cfo" className="text-muted-foreground">Curso CFO</Label>
        <Select name="cfo" value={formData.cfo} onValueChange={(value) => handleSelectChange('cfo', value)}>
          <SelectTrigger className="input-dark mt-1"><SelectValue placeholder="Sim/Não" /></SelectTrigger>
          <SelectContent>{YES_NO_OPTIONS.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="patente_atual" className="text-muted-foreground">Patente Atual</Label>
        <Select name="patente_atual" value={formData.patente_atual} onValueChange={(value) => handleSelectChange('patente_atual', value)}>
          <SelectTrigger className="input-dark mt-1"><SelectValue placeholder="Patente" /></SelectTrigger>
          <SelectContent>{PATENTE_OPTIONS.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="promocao_status" className="text-muted-foreground">Status Promoção (Interno)</Label>
        <Input id="promocao_status" name="promocao_status" value={formData.promocao_status} onChange={handleChange} className="input-dark mt-1" placeholder="Ex: Promovido por mérito" />
      </div>
      <div>
        <Label htmlFor="jogo_principal" className="text-muted-foreground">Jogo Principal</Label>
        <Select name="jogo_principal" value={formData.jogo_principal} onValueChange={(value) => handleSelectChange('jogo_principal', value)}>
          <SelectTrigger className="input-dark mt-1"><SelectValue placeholder="Jogo" /></SelectTrigger>
          <SelectContent>{JOGO_PRINCIPAL_OPTIONS.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="data_ingresso" className="text-muted-foreground">Data Ingresso</Label>
        <Input id="data_ingresso" name="data_ingresso" type="date" value={formData.data_ingresso} onChange={handleChange} className="input-dark mt-1" />
      </div>
      {isEditing && (
        <>
          <div className="md:col-span-2">
            <Label htmlFor="data_saida" className="text-muted-foreground">Data Saída (se aplicável)</Label>
            <Input id="data_saida" name="data_saida" type="date" value={formData.data_saida} onChange={handleChange} className="input-dark mt-1" />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="observacoes_saida" className="text-muted-foreground">Observações (Geral / Saída)</Label>
            <Textarea id="observacoes_saida" name="observacoes_saida" value={formData.observacoes_saida} onChange={handleChange} className="input-dark mt-1 min-h-[60px] sm:min-h-[80px]" placeholder="Observações gerais ou motivo da saída" />
          </div>
        </>
      )}
    </div>
  );
};

export default MemberFormFields;