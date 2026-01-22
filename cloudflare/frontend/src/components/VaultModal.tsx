/**
 * VaultModal - Modal for setting up or unlocking the encryption vault
 * 
 * Used in two scenarios:
 * 1. After signup - to set up the vault passphrase (mode="setup")
 * 2. After login - to unlock the vault with existing passphrase (mode="unlock")
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, Shield, Loader2, Check, AlertTriangle } from './Icons';
import { encryptionService } from '../services/encryptionService';

interface VaultModalProps {
  isOpen: boolean;
  mode: 'setup' | 'unlock';
  onComplete: () => void;
  onSkip?: () => void; // Only for setup mode - allows skipping encryption
}

export function VaultModal({ isOpen, mode, onComplete, onSkip }: VaultModalProps) {
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const passphraseChecks = [
    { label: 'At least 12 characters', valid: passphrase.length >= 12 },
    { label: 'Contains a number', valid: /\d/.test(passphrase) },
    { label: 'Contains uppercase', valid: /[A-Z]/.test(passphrase) },
    { label: 'Contains special character', valid: /[!@#$%^&*(),.?":{}|<>]/.test(passphrase) },
  ];

  const isPassphraseValid = passphraseChecks.every(check => check.valid);

  const handleSetup = async () => {
    if (!isPassphraseValid) {
      setError('Please meet all passphrase requirements');
      return;
    }
    if (passphrase !== confirmPassphrase) {
      setError('Passphrases do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await encryptionService.setupEncryption(passphrase);
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to set up encryption');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (!passphrase) {
      setError('Please enter your vault passphrase');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const success = await encryptionService.unlockVault(passphrase);
      if (success) {
        onComplete();
      } else {
        setError('Invalid passphrase. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to unlock vault');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'setup') {
      handleSetup();
    } else {
      handleUnlock();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1100] flex items-center justify-center px-4 bg-void/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md"
          >
            {/* Card glow */}
            <div className="absolute -inset-4 bg-gold/10 blur-3xl rounded-full" />
            
            <div className="card glass-strong relative">
              {/* Glass shine */}
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white/[0.08] to-transparent rounded-t-2xl pointer-events-none" />
              
              <div className="relative">
                {/* Header */}
                <div className="text-center mb-6">
                  <motion.div
                    className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold/10 flex items-center justify-center"
                    animate={{ 
                      boxShadow: [
                        '0 0 20px rgba(201,169,89,0.2)',
                        '0 0 40px rgba(201,169,89,0.4)',
                        '0 0 20px rgba(201,169,89,0.2)'
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Shield size={32} className="text-gold" />
                  </motion.div>
                  
                  <h2 className="text-2xl font-light mb-2">
                    {mode === 'setup' ? 'Secure Your Vault' : 'Unlock Your Vault'}
                  </h2>
                  <p className="text-paper/50 text-sm">
                    {mode === 'setup' 
                      ? 'Create a vault passphrase to encrypt your memories. This is separate from your login password and provides an extra layer of security.'
                      : 'Enter your vault passphrase to access your encrypted memories.'
                    }
                  </p>
                </div>

                {/* Zero-knowledge badge */}
                <div className="mb-6 p-3 bg-gold/5 border border-gold/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Lock size={18} className="text-gold mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-paper/70">
                      <strong className="text-gold">Zero-Knowledge Encryption:</strong> Your passphrase never leaves your device. We cannot access or recover your data without it.
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-blood/10 border border-blood/30 rounded-lg text-blood text-sm flex items-center gap-2"
                    >
                      <AlertTriangle size={16} />
                      {error}
                    </motion.div>
                  )}

                  <div>
                    <label className="block text-sm text-paper/50 mb-2">
                      {mode === 'setup' ? 'Create Vault Passphrase' : 'Vault Passphrase'}
                    </label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-paper/30" />
                      <input
                        type={showPassphrase ? 'text' : 'password'}
                        value={passphrase}
                        onChange={(e) => setPassphrase(e.target.value)}
                        placeholder={mode === 'setup' ? 'Create a strong passphrase' : 'Enter your passphrase'}
                        className="input pl-12 pr-12"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassphrase(!showPassphrase)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-paper/30 hover:text-paper transition-colors"
                      >
                        {showPassphrase ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Passphrase strength indicators - only for setup */}
                  {mode === 'setup' && (
                    <>
                      <div className="space-y-1">
                        {passphraseChecks.map(({ label, valid }) => (
                          <div key={label} className="flex items-center gap-2 text-xs">
                            <div className={`w-3 h-3 rounded-full flex items-center justify-center ${valid ? 'bg-green-500' : 'bg-paper/10'}`}>
                              {valid && <Check size={8} className="text-void" />}
                            </div>
                            <span className={valid ? 'text-green-400' : 'text-paper/40'}>{label}</span>
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="block text-sm text-paper/50 mb-2">Confirm Passphrase</label>
                        <div className="relative">
                          <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-paper/30" />
                          <input
                            type="password"
                            value={confirmPassphrase}
                            onChange={(e) => setConfirmPassphrase(e.target.value)}
                            placeholder="Confirm your passphrase"
                            className={`input pl-12 ${confirmPassphrase && passphrase !== confirmPassphrase ? 'border-blood' : ''}`}
                          />
                        </div>
                        {confirmPassphrase && passphrase !== confirmPassphrase && (
                          <p className="text-blood text-xs mt-1">Passphrases do not match</p>
                        )}
                      </div>

                      {/* Warning about passphrase recovery */}
                      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-amber-200">
                            <strong>Important:</strong> Write down your passphrase and store it safely. If you forget it, your encrypted data cannot be recovered.
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  <motion.button
                    type="submit"
                    disabled={isLoading || (mode === 'setup' && (!isPassphraseValid || passphrase !== confirmPassphrase))}
                    className="btn btn-primary w-full py-4"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isLoading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : mode === 'setup' ? (
                      <>
                        <Shield size={20} />
                        Enable Encryption
                      </>
                    ) : (
                      <>
                        <Lock size={20} />
                        Unlock Vault
                      </>
                    )}
                  </motion.button>

                  {/* Skip option for setup only */}
                  {mode === 'setup' && onSkip && (
                    <button
                      type="button"
                      onClick={onSkip}
                      className="w-full text-center text-sm text-paper/40 hover:text-paper/60 transition-colors py-2"
                    >
                      Skip for now (you can enable encryption later)
                    </button>
                  )}
                </form>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
