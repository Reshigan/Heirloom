import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function NotFound() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Sanctuary Background */}
      <div className="sanctuary-bg">
        <div className="sanctuary-orb sanctuary-orb-1" />
        <div className="sanctuary-orb sanctuary-orb-2" />
        <div className="sanctuary-orb sanctuary-orb-3" />
        <div className="sanctuary-stars" />
        <div className="sanctuary-mist" />
      </div>

      {/* Animated constellation stars */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-px h-px bg-gold rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* 404 Number */}
          <motion.h1
            className="text-[120px] md:text-[180px] font-light text-gold/20 leading-none mb-4"
            animate={{
              textShadow: [
                '0 0 20px rgba(201,169,89,0.2)',
                '0 0 40px rgba(201,169,89,0.3)',
                '0 0 20px rgba(201,169,89,0.2)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            404
          </motion.h1>

          {/* Message */}
                    <h2 className="text-2xl md:text-3xl font-light text-paper mb-4">
                      {t('errors.notFound')}
                    </h2>
                    <p className="text-paper/50 max-w-md mx-auto mb-8">
                      {t('errors.notFoundMessage')}
                    </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              onClick={() => navigate(-1)}
              className="btn btn-secondary flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
                            <ArrowLeft size={18} />
                            {t('common.goBack')}
            </motion.button>
            <motion.button
              onClick={() => navigate('/')}
              className="btn btn-primary flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
                            <Home size={18} />
                            {t('common.returnHome')}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
