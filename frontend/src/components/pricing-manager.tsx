'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crown, 
  Zap, 
  Infinity, 
  Star,
  Check, 
  X,
  CreditCard,
  Globe,
  Package,
  Mic,
  Camera,
  FileText,
  HardDrive,
  Users,
  Shield,
  Sparkles,
  Gift,
  Download,
  Phone
} from 'lucide-react';
import { LuxCard, LuxButton } from './lux';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: 'month' | 'year';
  storage: string;
  storageGB: number;
  features: string[];
  limitations: string[];
  popular?: boolean;
  icon: React.ComponentType<any>;
  gradient: string;
  unlockTokens: number;
}

interface AddOnService {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  icon: React.ComponentType<any>;
  category: 'physical' | 'digital' | 'service';
}

interface StorageUsage {
  used: number;
  total: number;
  breakdown: {
    photos: number;
    videos: number;
    audio: number;
    text: number;
  };
}

const PricingManager: React.FC = () => {
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [billingPeriod, setBillingPeriod] = useState<'month' | 'year'>('year');
  const [activeTab, setActiveTab] = useState<'plans' | 'addons' | 'usage'>('plans');
  const [currentPlan, setCurrentPlan] = useState('essential');

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' }
  ];

  const plans: PricingPlan[] = [
    {
      id: 'essential',
      name: 'Heirloom Essential',
      price: billingPeriod === 'year' ? 24 : 3,
      currency: selectedCurrency,
      period: billingPeriod,
      storage: '5GB',
      storageGB: 5,
      unlockTokens: 3,
      icon: FileText,
      gradient: 'from-blue-600 to-blue-500',
      features: [
        '~2,500 photos (compressed)',
        '~50 hours compressed audio',
        'Unlimited text entries',
        'Up to 50 video messages (2min each)',
        'Voice notes (compressed)',
        '3 unlock tokens',
        'Basic emotion/theme tagging',
        'Auto-compression enabled'
      ],
      limitations: [
        'No original quality storage',
        'Limited video length',
        'Basic features only'
      ]
    },
    {
      id: 'premium',
      name: 'Heirloom Premium',
      price: billingPeriod === 'year' ? 60 : 6,
      currency: selectedCurrency,
      period: billingPeriod,
      storage: '25GB',
      storageGB: 25,
      unlockTokens: 10,
      icon: Crown,
      gradient: 'from-purple-600 to-purple-500',
      popular: true,
      features: [
        '~12,500 photos (high quality)',
        '~250 hours audio',
        'Unlimited text entries',
        'Unlimited video messages (5min each)',
        '10 unlock tokens',
        'Advanced emotion AI tagging',
        'Priority slots for original quality',
        'Family tree collaboration',
        'Advanced search & filtering'
      ],
      limitations: [
        'Limited original quality slots',
        'Standard support'
      ]
    },
    {
      id: 'unlimited',
      name: 'Heirloom Unlimited',
      price: billingPeriod === 'year' ? 120 : 12,
      currency: selectedCurrency,
      period: billingPeriod,
      storage: '100GB',
      storageGB: 100,
      unlockTokens: 25,
      icon: Zap,
      gradient: 'from-gold-600 to-gold-500',
      features: [
        '~50,000 photos (original quality)',
        '~1,000 hours audio',
        'Unlimited everything',
        'Unlimited video length',
        '25 unlock tokens',
        'AI-powered memory enhancement',
        'Original quality vault',
        'Multi-generational access',
        'Priority support',
        'Advanced analytics'
      ],
      limitations: []
    },
    {
      id: 'dynasty',
      name: 'Heirloom Dynasty',
      price: billingPeriod === 'year' ? 299 : 30,
      currency: selectedCurrency,
      period: billingPeriod,
      storage: '500GB',
      storageGB: 500,
      unlockTokens: 100,
      icon: Star,
      gradient: 'from-gradient-to-r from-amber-600 via-gold-500 to-yellow-400',
      features: [
        '~250,000 photos (original quality)',
        '~5,000 hours audio',
        'Unlimited everything',
        'White-glove onboarding',
        '100 unlock tokens',
        'Dedicated family historian',
        'Custom family website',
        'Physical backup services',
        'Concierge support',
        'Legacy planning consultation'
      ],
      limitations: []
    }
  ];

  const addOns: AddOnService[] = [
    {
      id: 'photo_book',
      name: 'Annual Photo Book',
      description: 'Professional printed photo book with your year\'s memories',
      price: 49,
      currency: selectedCurrency,
      icon: Package,
      category: 'physical'
    },
    {
      id: 'voice_cloning',
      name: 'AI Voice Synthesis',
      description: 'Clone your voice to read text entries aloud',
      price: 99,
      currency: selectedCurrency,
      icon: Mic,
      category: 'digital'
    },
    {
      id: 'legacy_video',
      name: 'Legacy Documentary',
      description: 'Professional 10-minute documentary of your life',
      price: 199,
      currency: selectedCurrency,
      icon: Camera,
      category: 'service'
    },
    {
      id: 'backup_usb',
      name: 'Encrypted Backup USB',
      description: 'Annual physical backup shipped to your address',
      price: 29,
      currency: selectedCurrency,
      icon: Download,
      category: 'physical'
    },
    {
      id: 'express_unlock',
      name: 'Express Unlock',
      description: 'Immediate access without waiting period',
      price: 9.99,
      currency: selectedCurrency,
      icon: Zap,
      category: 'service'
    },
    {
      id: 'extra_tokens',
      name: 'Additional Unlock Tokens',
      description: '5 additional legacy access tokens',
      price: 25,
      currency: selectedCurrency,
      icon: Shield,
      category: 'digital'
    }
  ];

  const storageUsage: StorageUsage = {
    used: 3.2,
    total: 5,
    breakdown: {
      photos: 2.1,
      videos: 0.8,
      audio: 0.2,
      text: 0.1
    }
  };

  const getCurrencySymbol = (code: string) => {
    return currencies.find(c => c.code === code)?.symbol || '$';
  };

  const formatPrice = (price: number, currency: string) => {
    const symbol = getCurrencySymbol(currency);
    if (currency === 'JPY') {
      return `${symbol}${Math.round(price * 100)}`;
    }
    return `${symbol}${price}`;
  };

  const getStorageColor = (percentage: number) => {
    if (percentage < 50) return 'from-green-500 to-green-400';
    if (percentage < 80) return 'from-yellow-500 to-yellow-400';
    return 'from-red-500 to-red-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-obsidian-900 via-obsidian-800 to-charcoal text-pearl">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-gold-600 to-gold-500 rounded-xl">
              <CreditCard className="w-6 h-6 text-obsidian-900" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gold-400 to-gold-300 bg-clip-text text-transparent">
                Subscription & Pricing
              </h1>
              <p className="text-gold-400/70 mt-1">
                Manage your Heirloom subscription and storage
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* Currency Selector */}
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-gold-400" />
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="bg-obsidian-800 border border-gold-600/30 rounded-lg px-3 py-2 text-gold-300 focus:outline-none focus:border-gold-500"
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.code}
                  </option>
                ))}
              </select>
            </div>

            {/* Billing Period Toggle */}
            <div className="flex bg-obsidian-800/50 p-1 rounded-lg">
              <button
                onClick={() => setBillingPeriod('month')}
                className={`px-4 py-2 rounded-md transition-all duration-300 ${
                  billingPeriod === 'month'
                    ? 'bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-900'
                    : 'text-gold-400 hover:text-gold-300'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('year')}
                className={`px-4 py-2 rounded-md transition-all duration-300 ${
                  billingPeriod === 'year'
                    ? 'bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-900'
                    : 'text-gold-400 hover:text-gold-300'
                }`}
              >
                Yearly
                <span className="ml-1 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                  Save 33%
                </span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-obsidian-800/60 p-1 rounded-xl backdrop-blur-md border border-gold-500/20">
          {[
            { id: 'plans', label: 'Subscription Plans', icon: Crown },
            { id: 'addons', label: 'Add-on Services', icon: Gift },
            { id: 'usage', label: 'Storage Usage', icon: HardDrive }
          ].map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-900 shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                  : 'text-gold-400/70 hover:text-gold-400 hover:bg-obsidian-700/50'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </motion.button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'plans' && (
            <motion.div
              key="plans"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {plans.map((plan) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`relative bg-gradient-to-br from-obsidian-800/90 to-charcoal/90 backdrop-blur-md rounded-2xl p-6 border transition-all duration-500 hover:scale-105 ${
                    plan.popular 
                      ? 'border-gold-500/60 shadow-[0_0_30px_rgba(212,175,55,0.3)]' 
                      : 'border-gold-600/30 hover:border-gold-500/40 hover:shadow-[0_0_20px_rgba(212,175,55,0.2)]'
                  } ${
                    currentPlan === plan.id ? 'ring-2 ring-gold-500 shadow-[0_0_35px_rgba(212,175,55,0.4)]' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-900 px-4 py-1 rounded-full text-sm font-semibold">
                        Most Popular
                      </div>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <div className={`p-3 bg-gradient-to-r ${plan.gradient} rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center`}>
                      <plan.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gold-300 mb-2">
                      {plan.name}
                    </h3>
                    <div className="text-3xl font-bold text-gold-200 mb-1">
                      {formatPrice(plan.price, plan.currency)}
                    </div>
                    <div className="text-gold-400/60 text-sm">
                      per {plan.period}
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gold-300">
                        {plan.storage}
                      </div>
                      <div className="text-gold-400/60 text-sm">Storage</div>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold text-gold-300">
                        {plan.unlockTokens}
                      </div>
                      <div className="text-gold-400/60 text-sm">Unlock Tokens</div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    {plan.features.slice(0, 4).map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <span className="text-gold-300">{feature}</span>
                      </div>
                    ))}
                    {plan.features.length > 4 && (
                      <div className="text-gold-400/60 text-sm">
                        +{plan.features.length - 4} more features
                      </div>
                    )}
                  </div>

                  <motion.button
                    onClick={() => setCurrentPlan(plan.id)}
                    className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${
                      currentPlan === plan.id
                        ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]'
                        : `bg-gradient-to-r ${plan.gradient} text-white hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]`
                    }`}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {currentPlan === plan.id ? 'Current Plan' : 'Select Plan'}
                  </motion.button>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === 'addons' && (
            <motion.div
              key="addons"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {['physical', 'digital', 'service'].map((category) => (
                <div key={category} className="space-y-4">
                  <h3 className="text-xl font-semibold text-gold-300 capitalize">
                    {category} Add-ons
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {addOns
                      .filter((addon) => addon.category === category)
                      .map((addon) => (
                        <motion.div
                          key={addon.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-gradient-to-br from-obsidian-800/80 to-charcoal/80 backdrop-blur-sm rounded-xl p-4 border border-gold-600/20 hover:border-gold-500/30 transition-all duration-300"
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <div className="p-2 bg-gradient-to-r from-gold-600/20 to-gold-500/20 rounded-lg">
                              <addon.icon className="w-5 h-5 text-gold-400" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gold-300 mb-1">
                                {addon.name}
                              </h4>
                              <p className="text-gold-400/70 text-sm mb-3">
                                {addon.description}
                              </p>
                              <div className="flex items-center justify-between">
                                <div className="text-lg font-bold text-gold-200">
                                  {formatPrice(addon.price, addon.currency)}
                                </div>
                                <button className="px-4 py-2 bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-900 rounded-lg text-sm font-medium hover:shadow-lg transition-all duration-300">
                                  Add
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'usage' && (
            <motion.div
              key="usage"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Storage Overview */}
              <div className="bg-gradient-to-br from-obsidian-800/80 to-charcoal/80 backdrop-blur-sm rounded-2xl p-6 border border-gold-600/20">
                <h3 className="text-xl font-semibold text-gold-300 mb-4 flex items-center gap-2">
                  <HardDrive className="w-5 h-5" />
                  Storage Usage
                </h3>
                
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gold-300">
                      {storageUsage.used}GB of {storageUsage.total}GB used
                    </span>
                    <span className="text-gold-400/70">
                      {Math.round((storageUsage.used / storageUsage.total) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-obsidian-900/50 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full bg-gradient-to-r ${getStorageColor(
                        (storageUsage.used / storageUsage.total) * 100
                      )}`}
                      style={{
                        width: `${(storageUsage.used / storageUsage.total) * 100}%`
                      }}
                    />
                  </div>
                </div>

                {/* Storage Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(storageUsage.breakdown).map(([type, usage]) => (
                    <div key={type} className="text-center p-3 bg-obsidian-900/50 rounded-lg">
                      <div className="text-lg font-bold text-gold-300">
                        {usage}GB
                      </div>
                      <div className="text-gold-400/60 text-sm capitalize">
                        {type}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Optimization Suggestions */}
              <div className="bg-gradient-to-br from-obsidian-800/80 to-charcoal/80 backdrop-blur-sm rounded-2xl p-6 border border-gold-600/20">
                <h3 className="text-xl font-semibold text-gold-300 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Storage Optimization
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <Zap className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-300 mb-1">
                        Enable Smart Compression
                      </h4>
                      <p className="text-blue-200/70 text-sm">
                        Reduce storage usage by 70% with intelligent compression
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <FileText className="w-5 h-5 text-green-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-300 mb-1">
                        Use Essence Mode
                      </h4>
                      <p className="text-green-200/70 text-sm">
                        Focus on key memories instead of storing everything
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PricingManager;
