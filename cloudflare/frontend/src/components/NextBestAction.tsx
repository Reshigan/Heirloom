import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Image, Mic, Pen, Users, Shield, ArrowRight, Check, Sparkles } from './Icons';

export interface UserProgress {
  memoriesCount: number;
  recordingsCount: number;
  lettersCount: number;
  familyMembersCount: number;
  legacyContactsCount: number;
  deadmanConfigured: boolean;
}

interface NextBestActionProps {
  progress: UserProgress;
  className?: string;
}

interface ActionItem {
  id: string;
  title: string;
  description: string;
  icon: typeof Image;
  link: string;
  isComplete: boolean;
  priority: number;
}

export function NextBestAction({ progress, className = '' }: NextBestActionProps) {
  // Define all possible actions with their completion status
  const allActions: ActionItem[] = [
    {
      id: 'memory',
      title: 'Add your first memory',
      description: 'Upload a photo with a story to preserve',
      icon: Image,
      link: '/memories',
      isComplete: progress.memoriesCount > 0,
      priority: 1,
    },
    {
      id: 'recording',
      title: 'Record your voice',
      description: 'Share a story in your own voice',
      icon: Mic,
      link: '/record',
      isComplete: progress.recordingsCount > 0,
      priority: 2,
    },
    {
      id: 'letter',
      title: 'Write a letter',
      description: 'Compose a heartfelt message for loved ones',
      icon: Pen,
      link: '/compose',
      isComplete: progress.lettersCount > 0,
      priority: 3,
    },
    {
      id: 'family',
      title: 'Add family members',
      description: 'Build your family constellation',
      icon: Users,
      link: '/family',
      isComplete: progress.familyMembersCount > 0,
      priority: 4,
    },
    {
      id: 'legacy-contact',
      title: 'Set up legacy contacts',
      description: 'Choose trusted people to verify your passing',
      icon: Shield,
      link: '/settings?tab=deadman',
      isComplete: progress.legacyContactsCount > 0,
      priority: 5,
    },
  ];

  // Get incomplete actions sorted by priority
  const incompleteActions = allActions
    .filter(action => !action.isComplete)
    .sort((a, b) => a.priority - b.priority);

  // Get completed count for progress indicator
  const completedCount = allActions.filter(a => a.isComplete).length;
  const totalCount = allActions.length;
  const progressPercent = (completedCount / totalCount) * 100;

  // If all actions are complete, show a celebration message
  if (incompleteActions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`card bg-gradient-to-br from-gold/10 to-gold/5 border-gold/20 ${className}`}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gold/20 flex items-center justify-center">
            <Sparkles size={24} className="text-gold" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-medium text-paper">You're all set!</h3>
            <p className="text-paper/60 text-sm md:text-base">Your legacy foundation is complete. Keep adding memories to enrich it.</p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Get the next action to show
  const nextAction = incompleteActions[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card ${className}`}
    >
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-paper/50">Getting Started</span>
        <span className="text-sm text-gold">{completedCount}/{totalCount} complete</span>
      </div>
      
      {/* Progress bar */}
      <div className="h-1.5 bg-paper/10 rounded-full mb-6 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-gold to-gold-light rounded-full"
        />
      </div>

      {/* Next action card */}
      <Link
        to={nextAction.link}
        className="block p-4 md:p-5 rounded-xl bg-paper/5 border border-paper/10 hover:border-gold/30 hover:bg-gold/5 transition-all group touch-target"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0 group-hover:bg-gold/20 transition-colors">
            <nextAction.icon size={24} className="text-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base md:text-lg font-medium text-paper group-hover:text-gold transition-colors">
              {nextAction.title}
            </h3>
            <p className="text-sm text-paper/50 truncate">{nextAction.description}</p>
          </div>
          <ArrowRight size={20} className="text-paper/30 group-hover:text-gold group-hover:translate-x-1 transition-all flex-shrink-0" />
        </div>
      </Link>

      {/* Quick action pills for other incomplete items */}
      {incompleteActions.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-xs text-paper/40">Also try:</span>
          {incompleteActions.slice(1, 4).map(action => (
            <Link
              key={action.id}
              to={action.link}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-paper/5 border border-paper/10 text-xs text-paper/60 hover:border-gold/30 hover:text-gold transition-all"
            >
              <action.icon size={12} />
              {action.title.replace('Add your first ', '').replace('Set up ', '')}
            </Link>
          ))}
        </div>
      )}

      {/* Completed items (collapsed) */}
      {completedCount > 0 && (
        <div className="mt-4 pt-4 border-t border-paper/10">
          <div className="flex flex-wrap gap-2">
            {allActions.filter(a => a.isComplete).map(action => (
              <div
                key={action.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald/10 text-xs text-emerald"
              >
                <Check size={12} />
                {action.title.replace('Add your first ', '').replace('Set up ', '').replace('Write a ', '').replace('Record your ', '')}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
