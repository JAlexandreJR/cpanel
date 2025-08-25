
    import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Gamepad2, Search, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GameOwnersDialog = ({ isOpen, onOpenChange, game }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOwners = useMemo(() => {
    if (!game?.owners) return [];
    return game.owners.filter(owner =>
      owner.codinome.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [game, searchTerm]);

  if (!game) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-primary/30">
        <DialogHeader>
          <DialogTitle className="flex items-center text-primary text-xl">
            <Gamepad2 className="mr-2 h-6 w-6" />
            Jogadores de {game.name}
          </DialogTitle>
          <DialogDescription>
            Veja todos os membros do clã que possuem este jogo.
          </DialogDescription>
        </DialogHeader>
        <div className="my-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por codinome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input-dark"
            />
          </div>
        </div>
        <ScrollArea className="h-72 w-full pr-4">
          <div className="space-y-2">
            <AnimatePresence>
              {filteredOwners.length > 0 ? (
                filteredOwners.map((owner, index) => (
                  <motion.div
                    key={owner.codinome}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-4 rounded-md bg-secondary/30 p-2"
                  >
                    <Avatar className="h-10 w-10 border-2 border-primary/40">
                      <AvatarImage src={owner.avatar_url} alt={owner.codinome} />
                      <AvatarFallback>
                        {owner.codinome.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{owner.codinome}</p>
                      <p className="text-xs text-muted-foreground">{owner.patente_atual}</p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
                  <User className="h-10 w-10" />
                  <p className="mt-4">Nenhum jogador encontrado com o termo "{searchTerm}".</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default GameOwnersDialog;
  