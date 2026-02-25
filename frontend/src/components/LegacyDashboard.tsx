

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Users, 
  Heart, 
  FileText, 
  Shield, 
  Calendar,
  Award,
  Target,
  AlertCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

type Memory = {
  id: string;
  title: string;
  type: 'PHOTO' | 'VIDEO';
  recipients: { familyMember: { id: string; name: string } }[];
  createdAt: string;
};

type FamilyMember = {
  id: string;
  name: string;
  relationship: string;
  isActive: boolean;
};

interface LegacyDashboardProps {
  memories: Memory[];
  familyMembers: FamilyMember[];
  onSetupStep: (step: string) => void;
}

const LEGACY_STEPS = [
  {
    id: 'memories',
    title: 'Add Memories',
    description: 'Upload photos and videos to your legacy',
    icon: FileText,
    target: 10
  },
  {
    id: 'family',
    title: 'Add Family Members',
    description: 'Designate who will inherit your memories',
    icon: Users,
    target: 2
  },
  {
    id: 'stories',
    title: 'Write Stories',
    description: 'Add meaningful descriptions to your memories',
    icon: Heart,
    target: 5
  },
  {
    id: 'security',
    title: 'Security Setup',
    description: 'Configure your legacy access settings',
    icon: Shield,
    target: 1
  },
  {
    id: 'schedule',
    title: 'Legacy Schedule',
    description: 'Plan when memories should be released',
    icon: Calendar,
    target: 1
  }
];

export function LegacyDashboard({ memories, familyMembers, onSetupStep }: LegacyDashboardProps) {
  const { t } = useTranslation();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'year' | 'all'>('all');

  // Calculate legacy health score
  const healthScore = useMemo(() => {
    let score = 0;
    const maxScore = 100;
    
    // Memories (30% of score)
    const memoryScore = Math.min(30, (memories.length / 50) * 30);
    score += memoryScore;
    
    // Family members (25% of score)
    const familyScore = Math.min(25, (familyMembers.length / 5) * 25);
    score += familyScore;
    
    // Shared memories (20% of score)
    const sharedMemories = memories.filter(m => m.recipients.length > 0).length;
    const sharedScore = Math.min(20, (sharedMemories / memories.length) * 20);
    score += memories.length > 0 ? sharedScore : 0;
    
    // Recent activity (15% of score)
    const recentActivity = memories.filter(m => {
      const memoryDate = new Date(m.createdAt);
      const daysAgo = (Date.now() - memoryDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 30;
    }).length;
    const activityScore = Math.min(15, (recentActivity / 5) * 15);
    score += activityScore;
    
    // Legacy setup completion (10% of score)
    const setupStepsCompleted = LEGACY_STEPS.filter(step => {
      switch (step.id) {
        case 'memories': return memories.length >= step.target;
        case 'family': return familyMembers.length >= step.target;
        case 'stories': return memories.filter(m => m.title && m.title.length > 10).length >= step.target;
        case 'security': return true; // Always consider security as completed for now
        case 'schedule': return true; // Always consider schedule as completed for now
        default: return false;
      }
    }).length;
    const setupScore = (setupStepsCompleted / LEGACY_STEPS.length) * 10;
    score += setupScore;
    
    return Math.round(score);
  }, [memories, familyMembers]);

  // Get memories by timeframe
  const filteredMemories = useMemo(() => {
    const now = new Date();
    return memories.filter(memory => {
      const memoryDate = new Date(memory.createdAt);
      switch (selectedTimeframe) {
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return memoryDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return memoryDate >= monthAgo;
        case 'year':
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          return memoryDate >= yearAgo;
        default:
          return true;
      }
    });
  }, [memories, selectedTimeframe]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalMemories = filteredMemories.length;
    const photos = filteredMemories.filter(m => m.type === 'PHOTO').length;
    const videos = filteredMemories.filter(m => m.type === 'VIDEO').length;
    const sharedMemories = filteredMemories.filter(m => m.recipients.length > 0).length;
    const recentActivity = filteredMemories.filter(m => {
      const daysAgo = (Date.now() - new Date(m.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 7;
    }).length;

    return {
      totalMemories,
      photos,
      videos,
      sharedMemories,
      recentActivity,
      sharingRate: totalMemories > 0 ? Math.round((sharedMemories / totalMemories) * 100) : 0
    };
  }, [filteredMemories]);

  // Get health status
  const getHealthStatus = () => {
    if (healthScore >= 80) return { color: 'text-green-400', label: 'Excellent', icon: Award };
    if (healthScore >= 60) return { color: 'text-blue-400', label: 'Good', icon: TrendingUp };
    if (healthScore >= 40) return { color: 'text-yellow-400', label: 'Fair', icon: Clock };
    return { color: 'text-red-400', label: 'Needs Attention', icon: AlertCircle };
  };

  const healthStatus = getHealthStatus();
  const HealthIcon = healthStatus.icon;

  return (
    <div className="space-y-8">
      {/* Health Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-light text-paper mb-1">Legacy Health Score</h2>
            <p className="text-paper/50">How complete is your digital legacy?</p>
          </div>
          <div className={`text-4xl font-light ${healthStatus.color}`}>
            {healthScore}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-void-light rounded-full h-3 mb-4">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${
              healthScore >= 80 ? 'bg-green-400' :
              healthScore >= 60 ? 'bg-blue-400' :
              healthScore >= 40 ? 'bg-yellow-400' : 'bg-red-400'
            }`}
            style={{ width: `${healthScore}%` }}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <HealthIcon size={16} className={healthStatus.color} />
          <span className={healthStatus.color}>{healthStatus.label}</span>
        </div>
      </motion.div>

      {/* Setup Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-xl p-6"
      >
        <h3 className="text-xl font-light text-paper mb-4">Legacy Setup Progress</h3>
        <div className="space-y-4">
          {LEGACY_STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isCompleted = (() => {
              switch (step.id) {
                case 'memories': return memories.length >= step.target;
                case 'family': return familyMembers.length >= step.target;
                case 'stories': return memories.filter(m => m.title && m.title.length > 10).length >= step.target;
                case 'security': return true;
                case 'schedule': return true;
                default: return false;
              }
            })();
            
            const progress = (() => {
              switch (step.id) {
                case 'memories': return Math.min(100, (memories.length / step.target) * 100);
                case 'family': return Math.min(100, (familyMembers.length / step.target) * 100);
                case 'stories': 
                  const storiesCount = memories.filter(m => m.title && m.title.length > 10).length;
                  return Math.min(100, (storiesCount / step.target) * 100);
                default: return isCompleted ? 100 : 0;
              }
            })();

            return (
              <div key={step.id} className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isCompleted ? 'bg-green-400/20 text-green-400' : 'bg-paper/10 text-paper/50'
                }`}>
                  {isCompleted ? <CheckCircle size={16} /> : <StepIcon size={16} />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-paper">{step.title}</span>
                    <span className="text-paper/50 text-sm">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-void-light rounded-full h-2">
                    <div 
                      className="h-full rounded-full bg-gold transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-paper/50 text-sm mt-1">{step.description}</p>
                </div>
                <button
                  onClick={() => onSetupStep(step.id)}
                  className="btn btn-secondary text-sm"
                >
                  {isCompleted ? 'Review' : 'Setup'}
                </button>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Activity Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-light text-paper">Recent Activity</h3>
          <div className="flex gap-2">
            {['week', 'month', 'year', 'all'].map((timeframe) => (
              <button
                key={timeframe}
                onClick={() => setSelectedTimeframe(timeframe as any)}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
                  selectedTimeframe === timeframe ? 'bg-gold text-void' : 'glass text-paper/50 hover:text-paper'
                }`}
              >
                {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass p-4 rounded-lg text-center">
            <FileText size={20} className="text-gold mx-auto mb-2" />
            <div className="text-2xl font-light">{stats.totalMemories}</div>
            <div className="text-paper/50 text-sm">Total Memories</div>
          </div>
          
          <div className="glass p-4 rounded-lg text-center">
            <Users size={20} className="text-gold mx-auto mb-2" />
            <div className="text-2xl font-light">{stats.sharedMemories}</div>
            <div className="text-paper/50 text-sm">Shared ({stats.sharingRate}%)</div>
          </div>
          
          <div className="glass p-4 rounded-lg text-center">
            <TrendingUp size={20} className="text-gold mx-auto mb-2" />
            <div className="text-2xl font-light">{stats.recentActivity}</div>
            <div className="text-paper/50 text-sm">This Week</div>
          </div>
          
          <div className="glass p-4 rounded-lg text-center">
            <Target size={20} className="text-gold mx-auto mb-2" />
            <div className="text-2xl font-light">{familyMembers.length}</div>
            <div className="text-paper/50 text-sm">Family Members</div>
          </div>
        </div>
      </motion.div>

      {/* Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-xl p-6"
      >
        <h3 className="text-xl font-light text-paper mb-4">Recommendations</h3>
        <div className="space-y-3">
          {healthScore < 80 && (
            <>
              {memories.length < 10 && (
                <div className="flex items-center gap-3 text-yellow-400">
                  <AlertCircle size={16} />
                  <span>Add more memories to strengthen your legacy</span>
                </div>
              )}
              
              {familyMembers.length < 2 && (
                <div className="flex items-center gap-3 text-yellow-400">
                  <Users size={16} />
                  <span>Add family members to share your memories with</span>
                </div>
              )}
              
              {stats.sharingRate < 50 && (
                <div className="flex items-center gap-3 text-yellow-400">
                  <Heart size={16} />
                  <span>Share more memories with your loved ones</span>
                </div>
              )}
            </>
          )}
          
          {healthScore >= 80 && (
            <div className="flex items-center gap-3 text-green-400">
              <Award size={16} />
              <span>Your legacy is in excellent shape! Consider adding more personal stories.</span>
            </div>
          )}
          
          <div className="flex items-center gap-3 text-blue-400">
            <Shield size={16} />
            <span>Review your security settings regularly</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}



