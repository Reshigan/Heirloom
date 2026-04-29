import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Home } from 'lucide-react';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-void text-paper flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-prose text-center"
      >
        <p className="font-mono text-xs tracking-[0.32em] text-gold uppercase mb-6">404</p>
        <h1 className="font-serif font-light text-display-md text-paper mb-5 leading-tight">
          This page is not in the thread.
        </h1>
        <p className="text-paper/55 mb-12 leading-relaxed">
          The link is wrong, expired, or pointing at something that hasn't unlocked yet. Sometimes the same.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => navigate(-1)} className="btn btn-secondary">
            <ArrowLeft size={16} /> Back
          </button>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            <Home size={16} /> Home
          </button>
        </div>
      </motion.div>
    </main>
  );
}
