import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/components/admin/members/utils';

const statusConfig = {
  'TODOS': { label: 'Todos', color: 'text-white' },
  'EM ANÁLISE': { label: 'Em Análise', color: 'text-yellow-400' },
  'ACEITO-RECRUTAMENTO': { label: 'Agendado', color: 'text-blue-400' },
  'ACEITO': { label: 'Aceito (Membro)', color: 'text-green-400' },
  'RECUSADO': { label: 'Recusado', color: 'text-red-400' },
};

const RecruitmentTable = ({ applications, onOpenModal }) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Candidato</TableHead>
            <TableHead className="hidden md:table-cell">Data</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden sm:table-cell">Jogo Principal</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.length > 0 ? (
            applications.map(app => (
              <TableRow key={app.id} className="hover:bg-muted/20 transition-colors">
                <TableCell>
                  <div className="font-medium">{app.codinome}</div>
                  <div className="text-sm text-muted-foreground">{app.discord_nick}</div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{formatDate(app.created_at)}</TableCell>
                <TableCell>
                  <span className={`font-semibold ${statusConfig[app.status]?.color || 'text-white'}`}>
                    {statusConfig[app.status]?.label || app.status}
                  </span>
                </TableCell>
                <TableCell className="hidden sm:table-cell">{app.jogo_principal}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => onOpenModal(app)}>Ver Detalhes</Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center h-24">Nenhuma candidatura encontrada.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default RecruitmentTable;
