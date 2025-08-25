import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftCircle, ArrowRightCircle, ShieldHalf } from 'lucide-react';
import HeroSection from '@/components/landing/HeroSection';
import AboutSection from '@/components/landing/AboutSection';
import OfferingsSection from '@/components/landing/OfferingsSection';
import VideosSection from '@/components/landing/VideosSection';

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@400;700&family=Staatliches&display=swap');
    
    .font-arma {
      font-family: 'Staatliches', 'Impact', 'Arial Black', sans-serif;
      letter-spacing: 0.05em;
      line-height: 1.1;
    }
    .font-sans {
      font-family: 'Roboto Condensed', 'Arial', sans-serif;
    }

    @keyframes pulse-slow {
      0%, 100% { opacity: 0.4; transform: scale(1) rotate(0deg); }
      50% { opacity: 0.6; transform: scale(1.05) rotate(5deg); }
    }
    .animate-pulse-slow {
      animation: pulse-slow 10s infinite ease-in-out;
    }
    @keyframes pulse-slower {
      0%, 100% { opacity: 0.3; transform: scale(1) rotate(0deg); }
      50% { opacity: 0.5; transform: scale(1.03) rotate(-5deg); }
    }
    .animate-pulse-slower {
      animation: pulse-slower 12s infinite ease-in-out;
    }
    
    .glassmorphic-general {
      background: hsl(var(--card) / 0.5);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid hsl(var(--border) / 0.2);
    }
  `}</style>
);

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.9,
    filter: 'blur(10px)',
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.6,
      ease: [0.43, 0.13, 0.23, 0.96]
    }
  },
  exit: (direction) => ({
    zIndex: 0,
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.9,
    filter: 'blur(10px)',
    transition: {
      duration: 0.4,
      ease: [0.43, 0.13, 0.23, 0.96]
    }
  })
};

const loadingContainerVariants = {
  start: {
    transition: {
      staggerChildren: 0.1,
    },
  },
  end: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const loadingCircleVariants = {
  start: {
    y: "0%",
  },
  end: {
    y: "100%",
  },
};

const loadingTransition = {
  duration: 0.4,
  ease: 'easeInOut',
  repeat: Infinity,
  repeatType: 'reverse'
};

const LoadingScreen = () => (
  <motion.div
    key="loading-screen"
    initial={{ opacity: 1 }}
    exit={{ opacity: 0, transition: { duration: 0.5 } }}
    className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
  >
    <motion.div 
      className="w-40 h-40 mb-8"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ duration: 1, type: "spring" }}
    >
      <img src="https://storage.googleapis.com/hostinger-horizons-assets-prod/8b34e97e-b1fb-436b-96f9-daf091378bb8/cc4f42d355b391bbfd3dd0f5d604be74.png" alt="Logo GERR" />
    </motion.div>
    <motion.div
      className="w-48 h-2 flex justify-around"
      variants={loadingContainerVariants}
      initial="start"
      animate="end"
    >
      <motion.span className="block w-4 h-4 bg-primary rounded-full" variants={loadingCircleVariants} transition={loadingTransition} />
      <motion.span className="block w-4 h-4 bg-primary rounded-full" variants={loadingCircleVariants} transition={{...loadingTransition, delay: 0.2}} />
      <motion.span className="block w-4 h-4 bg-primary rounded-full" variants={loadingCircleVariants} transition={{...loadingTransition, delay: 0.4}} />
    </motion.div>
    <p className="mt-8 text-xl font-arma text-muted-foreground tracking-widest">CARREGANDO...</p>
  </motion.div>
);


const sections = [
  { id: 'about', component: <AboutSection /> },
  { id: 'offerings', component: <OfferingsSection /> },
  { id: 'videos', component: <VideosSection /> }
];

const LandingPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [[page, direction], setPage] = useState([0, 0]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000); 

    return () => clearTimeout(timer);
  }, []);

  const paginate = (newDirection) => {
    setPage([page + newDirection, newDirection]);
  };

  const activeIndex = (page % sections.length + sections.length) % sections.length;
  const ActiveComponent = sections[activeIndex].component;

  return (
    <AnimatePresence>
      {isLoading ? (
        <LoadingScreen />
      ) : (
        <motion.div 
          key="landing-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.8 } }}
          className="space-y-0 overflow-x-hidden bg-background"
        >
          <GlobalStyles />
          <HeroSection />
          
          <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-background/50 overflow-hidden pb-16">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={page}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full absolute top-0 left-0"
              >
                {ActiveComponent}
              </motion.div>
            </AnimatePresence>

            <motion.div
              className="absolute top-1/2 left-4 md:left-8 z-10"
              initial={{ opacity: 0.5, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.1, color: 'hsl(var(--primary-light))' }}
              whileTap={{ scale: 0.9 }}
            >
              <button onClick={() => paginate(-1)} className="p-2 rounded-full text-primary hover:text-primary-light transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary">
                <ArrowLeftCircle className="w-10 h-10 md:w-12 md:h-12" />
              </button>
            </motion.div>
            
            <motion.div
              className="absolute top-1/2 right-4 md:right-8 z-10"
              initial={{ opacity: 0.5, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.1, color: 'hsl(var(--primary-light))' }}
              whileTap={{ scale: 0.9 }}
            >
              <button onClick={() => paginate(1)} className="p-2 rounded-full text-primary hover:text-primary-light transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary">
                <ArrowRightCircle className="w-10 h-10 md:w-12 md:h-12" />
              </button>
            </motion.div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-3 z-10">
              {sections.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setPage([index, index > activeIndex ? 1 : -1])}
                  className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded-full"
                >
                  <motion.div
                    className="w-3 h-3 rounded-full"
                    animate={{
                      backgroundColor: index === activeIndex ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                      scale: index === activeIndex ? 1.3 : 1
                    }}
                    whileHover={{ scale: 1.5, backgroundColor: 'hsl(var(--primary-light))' }}
                    transition={{ duration: 0.3 }}
                  />
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LandingPage;