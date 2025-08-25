import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Calendar, Trash2 } from 'lucide-react';
import { formatDate } from '@/components/admin/members/utils';

const ApplicationDetailsDialog = ({ isOpen, onOpenChange, application, onUpdateStatus, onDelete, isProcessing }) => {
  const [recruiterNotes, setRecruiterNotes] = useState('');
  const [interviewDate, setInterviewDate] = useState('');

  useEffect(() => {
    if (application) {
      setRecruiterNotes(application.recruiter_notes || '');
      if (application.interview_date) {
        const localDate = new Date(application.interview_date);
        const year = localDate.getFullYear();
        const month = String(localDate.getMonth() + 1).padStart(2, '0');
        const day = String(localDate.getDate()).padStart(2, '0');
        const hours = String(localDate.getHours()).padStart(2, '0');
        const minutes = String(localDate.getMinutes()).padStart(2, '0');
        setInterviewDate(`${year}-${month}-${day}T${hours}:${minutes}`);
      } else {
        setInterviewDate('');
      }
    }
  }, [application]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card border-primary/30">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary">Detalhes da Candidatura: {application.codinome}</DialogTitle>
          <DialogDescription>
            Enviado em: {formatDate(application.created_at, 'dd/MM/yyyy HH:mm')}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-4">
          <p><strong>Discord:</strong> {application.discord_nick} ({application.discord_id})</p>
          <p><strong>SteamID64:</strong> {application.steam_id}</p>
          <p><strong>Perfil Steam:</strong> <a href={application.steam_profile_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Ver Perfil</a></p>
          <p><strong>Como conheceu:</strong> {application.how_found}</p>
          <p><strong>Disponibilidade:</strong> {application.availability}</p>
          <p><strong>Tempo de Jogo:</strong> {application.total_play_time || 'Não informado'}</p>
          <p><strong>Jogo Principal:</strong> {application.jogo_principal}</p>
          <p><strong>Motivo:</strong> {application.application_reason}</p>
          <p><strong>Recrutado por:</strong> {application.recruited_by_user?.nome || 'N/A'}</p>
          
          <div className="space-y-2 pt-4 border-t border-border">
            <Label htmlFor="recruiter_notes">Notas do Recrutador</Label>
            <Textarea id="recruiter_notes" value={recruiterNotes} onChange={(e) => setRecruiterNotes(e.target.value)} placeholder="Adicione suas anotações aqui..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="interview_date">Data e Hora da Entrevista</Label>
            <Input id="interview_date" type="datetime-local" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} />
          </div>
        </div>
        <DialogFooter className="flex-wrap gap-2 pt-4 justify-between">
          <div>
            <Button variant="ghost" className="text-red-500 hover:bg-red-500/10 hover:text-red-400" onClick={onDelete} disabled={isProcessing}>
              <Trash2 className="mr-2 h-4 w-4"/> Excluir Candidatura
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="destructive" onClick={() => onUpdateStatus('RECUSADO', recruiterNotes, interviewDate)} disabled={isProcessing}><XCircle className="mr-2" /> Recusar</Button>
            <Button variant="secondary" onClick={() => onUpdateStatus('ACEITO-RECRUTAMENTO', recruiterNotes, interviewDate)} disabled={isProcessing}><Calendar className="mr-2" /> Agendar Entrevista</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => onUpdateStatus('ACEITO', recruiterNotes, interviewDate)} disabled={isProcessing}><CheckCircle className="mr-2" /> Aprovar Membro</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApplicationDetailsDialog;
