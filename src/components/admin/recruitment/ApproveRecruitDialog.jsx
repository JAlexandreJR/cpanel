
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle } from 'lucide-react';

const ApproveRecruitDialog = ({ 
  isOpen, 
  onOpenChange, 
  application, 
  onConfirm, 
  isProcessing,
  title = "Aprovar Recruta",
  description = "Defina o e-mail e a senha para criar o acesso do novo membro ao painel."
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (application) {
      setEmail(application.email || '');
      setPassword('');
    }
  }, [application]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Email e senha são obrigatórios.");
      return;
    }
    onConfirm(email, password);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}: {application?.codinome}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="recruit-email">Email de Acesso</Label>
            <Input
              id="recruit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="email.do.membro@example.com"
            />
          </div>
          <div>
            <Label htmlFor="recruit-password">Senha de Acesso</Label>
            <Input
              id="recruit-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isProcessing}>Cancelar</Button>
            <Button type="submit" disabled={isProcessing}>
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Confirmar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ApproveRecruitDialog;
