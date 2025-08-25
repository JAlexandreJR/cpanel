import React from 'react';
import { motion } from 'framer-motion';

const DashboardHeader = ({ memberData, user, variants }) => {
  return (
    <div className="mb-10 text-center">
      <motion.h1 
        variants={variants}
        className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-destructive to-red-400 mb-3"
      >
        Quartel General Pessoal
      </motion.h1>
      <motion.p 
        variants={variants}
        className="text-lg text-muted-foreground"
      >
        Bem-vindo(a) de volta, <span className="font-semibold text-primary">{memberData.codinome || user.email}!</span>
      </motion.p>
    </div>
  );
};

export default DashboardHeader;