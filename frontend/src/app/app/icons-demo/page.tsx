'use client';

import React from 'react';
import { 
  SuccessStar, 
  ErrorStar, 
  WarningStar, 
  InfoOrbit, 
  ProgressOrbit, 
  SparkBullet 
} from '@/components/icons';

export default function IconsDemoPage() {
  return (
    <div className="min-h-screen p-12 bg-black-900">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-display text-gold-500 mb-2">
          Constellation Icon System
        </h1>
        <p className="text-cream-300 mb-12 text-lg">
          Custom icons designed to match the Heirloom luxury gold aesthetic
        </p>

        {/* SVG Icons Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-display text-gold-400 mb-6">SVG React Components</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Success Star */}
            <div className="bg-black-800 border border-gold-500/20 rounded-lg p-6">
              <div className="flex items-center justify-center mb-4">
                <SuccessStar size={48} />
              </div>
              <h3 className="text-gold-300 text-center font-semibold mb-2">SuccessStar</h3>
              <p className="text-cream-400 text-sm text-center">
                Constellation triangle with checkmark overlay
              </p>
              <div className="mt-4 flex justify-center gap-4">
                <SuccessStar size={16} />
                <SuccessStar size={24} />
                <SuccessStar size={32} />
              </div>
            </div>

            {/* Error Star */}
            <div className="bg-black-800 border border-gold-500/20 rounded-lg p-6">
              <div className="flex items-center justify-center mb-4">
                <ErrorStar size={48} />
              </div>
              <h3 className="text-gold-300 text-center font-semibold mb-2">ErrorStar</h3>
              <p className="text-cream-400 text-sm text-center">
                Four-point star with X overlay
              </p>
              <div className="mt-4 flex justify-center gap-4">
                <ErrorStar size={16} />
                <ErrorStar size={24} />
                <ErrorStar size={32} />
              </div>
            </div>

            {/* Warning Star */}
            <div className="bg-black-800 border border-gold-500/20 rounded-lg p-6">
              <div className="flex items-center justify-center mb-4">
                <WarningStar size={48} />
              </div>
              <h3 className="text-gold-300 text-center font-semibold mb-2">WarningStar</h3>
              <p className="text-cream-400 text-sm text-center">
                Triangle constellation with exclamation mark
              </p>
              <div className="mt-4 flex justify-center gap-4">
                <WarningStar size={16} />
                <WarningStar size={24} />
                <WarningStar size={32} />
              </div>
            </div>

            {/* Info Orbit */}
            <div className="bg-black-800 border border-gold-500/20 rounded-lg p-6">
              <div className="flex items-center justify-center mb-4">
                <InfoOrbit size={48} />
              </div>
              <h3 className="text-gold-300 text-center font-semibold mb-2">InfoOrbit</h3>
              <p className="text-cream-400 text-sm text-center">
                Planet with orbital ring and info symbol
              </p>
              <div className="mt-4 flex justify-center gap-4">
                <InfoOrbit size={16} />
                <InfoOrbit size={24} />
                <InfoOrbit size={32} />
              </div>
            </div>

            {/* Progress Orbit */}
            <div className="bg-black-800 border border-gold-500/20 rounded-lg p-6">
              <div className="flex items-center justify-center mb-4">
                <ProgressOrbit size={48} />
              </div>
              <h3 className="text-gold-300 text-center font-semibold mb-2">ProgressOrbit</h3>
              <p className="text-cream-400 text-sm text-center">
                Animated orbital path with star nodes
              </p>
              <div className="mt-4 flex justify-center gap-4">
                <ProgressOrbit size={16} />
                <ProgressOrbit size={24} />
                <ProgressOrbit size={32} />
              </div>
            </div>

            {/* Spark Bullet */}
            <div className="bg-black-800 border border-gold-500/20 rounded-lg p-6">
              <div className="flex items-center justify-center mb-4">
                <SparkBullet size={48} />
              </div>
              <h3 className="text-gold-300 text-center font-semibold mb-2">SparkBullet</h3>
              <p className="text-cream-400 text-sm text-center">
                Single star with four rays
              </p>
              <div className="mt-4 flex justify-center gap-4">
                <SparkBullet size={16} />
                <SparkBullet size={24} />
                <SparkBullet size={32} />
              </div>
            </div>
          </div>
        </section>

        {/* Text Icons Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-display text-gold-400 mb-6">Text-Based Unicode Icons</h2>
          
          <div className="bg-black-800 border border-gold-500/20 rounded-lg p-8">
            <div className="font-mono text-cream-300 space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-gold-400">[★]</span>
                <span>Success / Completed - Deployment successful</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-gold-400">[✖]</span>
                <span>Error / Failed - Connection timeout</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-gold-400">[▲]</span>
                <span>Warning / Caution - High memory usage detected</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-gold-400">[ℹ]</span>
                <span>Info / Note - Additional information available</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-gold-400">[◌]</span>
                <span>In Progress / Pending - Processing request...</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-gold-400">[•]</span>
                <span>Bullet / List Item - Standard list entry</span>
              </div>
            </div>
          </div>
        </section>

        {/* Usage Examples */}
        <section>
          <h2 className="text-2xl font-display text-gold-400 mb-6">Usage Examples</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status Messages */}
            <div className="bg-black-800 border border-gold-500/20 rounded-lg p-6">
              <h3 className="text-gold-300 font-semibold mb-4">Status Messages</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-black-700 rounded">
                  <SuccessStar size={20} />
                  <span className="text-cream-300">Changes saved successfully</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-black-700 rounded">
                  <ErrorStar size={20} />
                  <span className="text-cream-300">Failed to upload file</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-black-700 rounded">
                  <WarningStar size={20} />
                  <span className="text-cream-300">Storage limit approaching</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-black-700 rounded">
                  <ProgressOrbit size={20} />
                  <span className="text-cream-300">Processing...</span>
                </div>
              </div>
            </div>

            {/* List Items */}
            <div className="bg-black-800 border border-gold-500/20 rounded-lg p-6">
              <h3 className="text-gold-300 font-semibold mb-4">List Items</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <SparkBullet size={16} className="mt-1" />
                  <span className="text-cream-300">33 memories spanning 1923-2025</span>
                </div>
                <div className="flex items-start gap-3">
                  <SparkBullet size={16} className="mt-1" />
                  <span className="text-cream-300">3 recipients configured</span>
                </div>
                <div className="flex items-start gap-3">
                  <SparkBullet size={16} className="mt-1" />
                  <span className="text-cream-300">Vault encryption enabled</span>
                </div>
                <div className="flex items-start gap-3">
                  <SparkBullet size={16} className="mt-1" />
                  <span className="text-cream-300">2 voice recordings saved</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
