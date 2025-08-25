
import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, ShieldAlert } from 'lucide-react';
import { formatDate } from './utils';

const MemberFormWarnings = ({ advertencias, onAddWarning }) => {
  return (
    <div className="mt-6 border-t border-border pt-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-destructive flex items-center">
          <ShieldAlert className="mr-2 h-5 w-5" /> Advertências
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddWarning}
          className="btn-destructive-outline"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar
        </Button>
      </div>
      {advertencias && advertencias.length > 0 ? (
        <ul className="space-y-2 text-sm text-muted-foreground max-h-32 overflow-y-auto pr-1">
          {advertencias.map((adv, index) => (
            <li
              key={index}
              className="p-2 border rounded-md bg-card/50"
            >
              <strong>{adv.tipo}</strong> ({formatDate(adv.data, 'dd/MM/yyyy')}):{' '}
              {adv.motivo}
              {adv.responsavel && ` - Por: ${adv.responsavel}`}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          Nenhuma advertência registrada.
        </p>
      )}
    </div>
  );
};

export default MemberFormWarnings;
