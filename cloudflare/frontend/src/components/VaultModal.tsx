/**
 * VaultModal - Modal for setting up or unlocking the encryption vault
 * 
 * Used in two scenarios:
 * 1. After signup - to set up the vault passphrase (mode="setup")
 * 2. After login - to unlock the vault with existing passphrase (mode="unlock")
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-void/80"
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md"
          >
            <div className="bg-void-surface border border-paper-15 rounded-[2px] p-6 md:p-8">
              {/* Header */}
              <div className="text-center mb-6">
                <span className="font-body text-4xl text-gold block mb-5" aria-hidden>∞</span>
                <h2 className="font-body font-light text-2xl mb-2 tracking-[-0.014em]">
                  {mode === 'setup' ? 'Secure Your Vault' : 'Unlock Your Vault'}
                </h2>
                <p className="text-paper-65 text-sm leading-relaxed">
                  {mode === 'setup'
                    ? 'Create a vault passphrase to encrypt your memories. This is separate from your login password and provides an extra layer of security.'
                    : 'Enter your vault passphrase to access your encrypted memories.'
                  }
                </p>
              </div>

              {/* Zero-knowledge badge */}
              <div className="mb-6 p-3 bg-void-elevated border border-gold-40 rounded-[2px]">
                <p className="text-xs text-paper-70 leading-relaxed">
                  <strong className="text-gold">Zero-Knowledge Encryption:</strong> Your passphrase never leaves your device. We cannot access or recover your data without it.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    role="alert"
                    className="p-3 bg-void-elevated border border-blood/40 rounded-[2px] text-blood text-sm"
                  >
                    {error}
                  </motion.p>
                )}

                <div>
                  <label htmlFor="vault-passphrase" className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">
                    {mode === 'setup' ? 'Create Vault Passphrase' : 'Vault Passphrase'}
                  </label>
                  <div className="relative">
                    <input
                      id="vault-passphrase"
                      type={showPassphrase ? 'text' : 'password'}
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      placeholder={mode === 'setup' ? 'Create a strong passphrase' : 'Enter your passphrase'}
                      className="w-full bg-void border border-paper-15 focus:border-gold focus:outline-none text-paper pl-4 pr-16 py-3 rounded-[2px] placeholder:text-paper-30 transition-colors"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassphrase(!showPassphrase)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-paper-50 hover:text-paper transition-colors text-[0.65rem] font-mono uppercase tracking-[0.18em]"
                      aria-label={showPassphrase ? 'Hide passphrase' : 'Show passphrase'}
                    >
                      {showPassphrase ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                {/* Passphrase strength indicators - only for setup */}
                {mode === 'setup' && (
                  <>
                    <div className="space-y-1.5">
                      {passphraseChecks.map(({ label, valid }) => (
                        <div key={label} className="flex items-center gap-2.5 text-xs">
                          <span className={`font-mono ${valid ? 'text-gold' : 'text-paper-30'}`} aria-hidden>
                            {valid ? '✓' : '·'}
                          </span>
                          <span className={valid ? 'text-paper-70' : 'text-paper-50'}>{label}</span>
                        </div>
                      ))}
                    </div>

                    <div>
                      <label htmlFor="vault-confirm" className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">Confirm Passphrase</label>
                      <input
                        id="vault-confirm"
                        type="password"
                        value={confirmPassphrase}
                        onChange={(e) => setConfirmPassphrase(e.target.value)}
                        placeholder="Confirm your passphrase"
                        className={`w-full bg-void border focus:border-gold focus:outline-none text-paper px-4 py-3 rounded-[2px] placeholder:text-paper-30 transition-colors ${confirmPassphrase && passphrase !== confirmPassphrase ? 'border-blood' : 'border-paper-15'}`}
                      />
                      {confirmPassphrase && passphrase !== confirmPassphrase && (
                        <p className="text-blood text-xs mt-1.5">Passphrases do not match</p>
                      )}
                    </div>

                    {/* Warning about passphrase recovery */}
                    <div className="p-3 bg-void-elevated border border-gold-40 rounded-[2px]">
                      <p className="text-xs text-paper-70 leading-relaxed">
                        <strong className="text-gold">Important:</strong> Write down your passphrase and store it safely. If you forget it, your encrypted data cannot be recovered.
                      </p>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={isLoading || (mode === 'setup' && (!isPassphraseValid || passphrase !== confirmPassphrase))}
                  className="btn btn-primary w-full"
                >
                  {isLoading
                    ? (mode === 'setup' ? 'Enabling…' : 'Unlocking…')
                    : (mode === 'setup' ? 'Enable Encryption' : 'Unlock Vault')}
                </button>

                {/* Skip option for setup only */}
                {mode === 'setup' && onSkip && (
                  <button
                    type="button"
                    onClick={onSkip}
                    className="w-full text-center text-sm text-paper-50 hover:text-paper transition-colors py-2"
                  >
                    Skip for now (you can enable encryption later)
                  </button>
                )}
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
