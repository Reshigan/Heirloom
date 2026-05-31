import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-void text-paper antialiased flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
        className="text-center"
      >
        <p className="font-mono text-[0.7rem] tracking-[0.32em] uppercase text-gold mb-8">Error 404</p>

        <h1
          className="font-body font-light text-paper-30 leading-none mb-8"
          style={{ fontSize: 'clamp(5rem, 18vw, 11rem)' }}
        >
          404
        </h1>

        <h2 className="font-body font-light text-2xl md:text-3xl text-paper mb-4 tracking-[-0.012em]">
          Page not found.
        </h2>
        <p className="text-paper-65 max-w-md mx-auto mb-10 leading-relaxed">
          The page you're looking for seems to have drifted into the void.
          Let's guide you back to familiar territory.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-ghost"
          >
            <span aria-hidden>←</span> Go back
          </button>
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary"
          >
            Return home <span aria-hidden>→</span>
          </button>
        </div>
      </motion.div>
    </main>
  );
}
