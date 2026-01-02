import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Bell, Plus, X, Trash2, Sparkles, Gift, Heart, Star, Clock } from '../components/Icons';
import { Navigation } from '../components/Navigation';
import { milestonesApi } from '../services/api';

const milestoneTypes = [
  { id: 'birthday', name: 'Birthday', icon: Gift, color: 'from-pink-500 to-rose-500' },
  { id: 'anniversary', name: 'Anniversary', icon: Heart, color: 'from-red-500 to-pink-500' },
  { id: 'death_anniversary', name: 'Remembrance', icon: Star, color: 'from-purple-500 to-violet-500' },
  { id: 'wedding', name: 'Wedding', icon: Heart, color: 'from-gold to-amber-500' },
  { id: 'graduation', name: 'Graduation', icon: Star, color: 'from-blue-500 to-cyan-500' },
  { id: 'custom', name: 'Custom', icon: Calendar, color: 'from-green-500 to-emerald-500' },
];

export function Milestones() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'birthday',
    name: '',
    date: '',
    recurring: true,
    reminderDays: 7,
    promptSuggestion: '',
  });

  const { data: milestones, isLoading } = useQuery({
    queryKey: ['milestones'],
    queryFn: () => milestonesApi.getAll().then(r => r.data),
  });

  const { data: upcoming } = useQuery({
    queryKey: ['upcomingMilestones'],
    queryFn: () => milestonesApi.getUpcoming().then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => milestonesApi.create(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingMilestones'] });
      setShowCreateModal(false);
      setFormData({
        type: 'birthday',
        name: '',
        date: '',
        recurring: true,
        reminderDays: 7,
        promptSuggestion: '',
      });
    },
  });

  const autoDetectMutation = useMutation({
    mutationFn: () => milestonesApi.autoDetect(),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingMilestones'] });
      alert(`Auto-detected ${response.data.created} new milestones!`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => milestonesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingMilestones'] });
    },
  });

  const getDaysUntil = (dateStr: string, recurring: boolean) => {
    const date = new Date(dateStr);
    const now = new Date();
    
    if (recurring) {
      const thisYear = new Date(now.getFullYear(), date.getMonth(), date.getDate());
      if (thisYear < now) {
        thisYear.setFullYear(thisYear.getFullYear() + 1);
      }
      return Math.ceil((thisYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }
    
    return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getTypeInfo = (type: string) => {
    return milestoneTypes.find(t => t.id === type) || milestoneTypes[5];
  };

  return (
    <div className="min-h-screen bg-void">
      <Navigation />
      
      <main id="main-content" className="pt-24 pb-12 px-6 md:px-12 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-light mb-2">Milestone Alerts</h1>
            <p className="text-paper/60">Never miss an important date with smart reminders</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => autoDetectMutation.mutate()}
              disabled={autoDetectMutation.isPending}
              className="btn btn-secondary"
            >
              <Sparkles size={18} />
              <span>{autoDetectMutation.isPending ? 'Detecting...' : 'Auto-Detect'}</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              <Plus size={18} />
              <span>Add Milestone</span>
            </button>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Upcoming Milestones */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2 card"
            >
              <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Clock className="text-gold" size={20} />
                Coming Up (Next 30 Days)
              </h2>

              {upcoming && upcoming.length > 0 ? (
                <div className="space-y-3">
                  {upcoming.map((milestone: any) => {
                    const typeInfo = getTypeInfo(milestone.milestone_type);
                    const daysUntil = getDaysUntil(milestone.milestone_date, milestone.recurring);
                    const IconComponent = typeInfo.icon;
                    
                    return (
                      <div
                        key={milestone.id}
                        className={`p-4 rounded-xl bg-gradient-to-r ${typeInfo.color} bg-opacity-10 border border-white/10`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${typeInfo.color} flex items-center justify-center`}>
                              <IconComponent size={20} className="text-white" />
                            </div>
                            <div>
                              <div className="font-medium">{milestone.milestone_name}</div>
                              <div className="text-sm text-paper/60">
                                {milestone.family_member_name && `${milestone.family_member_name} • `}
                                {new Date(milestone.milestone_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-medium ${daysUntil <= 7 ? 'text-gold' : 'text-paper/70'}`}>
                              {daysUntil === 0 ? 'Today!' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                            </div>
                            {milestone.prompt_suggestion && (
                              <div className="text-xs text-paper/50 max-w-[200px] truncate">
                                {milestone.prompt_suggestion}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-paper/50">
                  <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No upcoming milestones in the next 30 days</p>
                </div>
              )}
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card"
            >
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Bell className="text-gold" size={20} />
                Reminder Settings
              </h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-paper/5 rounded-lg">
                  <div className="text-2xl font-light text-gold mb-1">
                    {milestones?.length || 0}
                  </div>
                  <div className="text-sm text-paper/60">Total Milestones</div>
                </div>

                <div className="p-4 bg-paper/5 rounded-lg">
                  <div className="text-2xl font-light text-gold mb-1">
                    {upcoming?.length || 0}
                  </div>
                  <div className="text-sm text-paper/60">Coming Up (30 days)</div>
                </div>

                <div className="text-sm text-paper/60">
                  <p className="mb-2">You'll receive reminders:</p>
                  <ul className="space-y-1 text-paper/50">
                    <li>7 days before each milestone</li>
                    <li>On the day of the milestone</li>
                    <li>With memory prompts to help you celebrate</li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* All Milestones */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-3 card"
            >
              <h2 className="text-lg font-medium mb-4">All Milestones</h2>

              {milestones && milestones.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-paper/50 text-sm border-b border-paper/10">
                        <th className="pb-3 font-medium">Name</th>
                        <th className="pb-3 font-medium">Type</th>
                        <th className="pb-3 font-medium">Date</th>
                        <th className="pb-3 font-medium">Recurring</th>
                        <th className="pb-3 font-medium">Reminder</th>
                        <th className="pb-3 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-paper/10">
                      {milestones.map((milestone: any) => {
                        const typeInfo = getTypeInfo(milestone.milestone_type);
                        const IconComponent = typeInfo.icon;
                        
                        return (
                          <tr key={milestone.id}>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${typeInfo.color} flex items-center justify-center`}>
                                  <IconComponent size={14} className="text-white" />
                                </div>
                                <div>
                                  <div className="font-medium">{milestone.milestone_name}</div>
                                  {milestone.family_member_name && (
                                    <div className="text-xs text-paper/50">{milestone.family_member_name}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 text-paper/70">{typeInfo.name}</td>
                            <td className="py-3 text-paper/70">
                              {new Date(milestone.milestone_date).toLocaleDateString()}
                            </td>
                            <td className="py-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                milestone.recurring ? 'bg-green-500/20 text-green-400' : 'bg-paper/10 text-paper/50'
                              }`}>
                                {milestone.recurring ? 'Yearly' : 'Once'}
                              </span>
                            </td>
                            <td className="py-3 text-paper/50 text-sm">
                              {milestone.reminder_days_before} days before
                            </td>
                            <td className="py-3">
                              <button
                                onClick={() => deleteMutation.mutate(milestone.id)}
                                className="text-paper/30 hover:text-red-400 transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-paper/50">
                  <Calendar size={48} className="mx-auto mb-4 opacity-30" />
                  <h3 className="text-lg font-light mb-2">No Milestones Yet</h3>
                  <p className="mb-4">Add important dates to get reminders and memory prompts</p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => autoDetectMutation.mutate()}
                      disabled={autoDetectMutation.isPending}
                      className="btn btn-secondary"
                    >
                      <Sparkles size={16} />
                      <span>Auto-Detect from Family</span>
                    </button>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="btn btn-primary"
                    >
                      <Plus size={16} />
                      <span>Add Manually</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </main>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="modal max-w-lg"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute top-4 right-4 text-paper/50 hover:text-paper"
              >
                <X size={20} />
              </button>

              <h3 className="text-xl font-medium mb-6">Add Milestone</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-paper/70 mb-2">Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {milestoneTypes.map((type) => {
                      const IconComponent = type.icon;
                      return (
                        <button
                          key={type.id}
                          onClick={() => setFormData({ ...formData, type: type.id })}
                          className={`p-3 rounded-lg text-center transition-all ${
                            formData.type === type.id
                              ? `bg-gradient-to-br ${type.color} text-white`
                              : 'bg-paper/5 hover:bg-paper/10'
                          }`}
                        >
                          <IconComponent size={20} className="mx-auto mb-1" />
                          <div className="text-xs">{type.name}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-paper/70 mb-2">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Mom's Birthday, Wedding Anniversary"
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm text-paper/70 mb-2">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="input w-full"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="recurring"
                    checked={formData.recurring}
                    onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })}
                    className="w-4 h-4 rounded border-paper/30"
                  />
                  <label htmlFor="recurring" className="text-sm text-paper/70">
                    Repeat every year
                  </label>
                </div>

                <div>
                  <label className="block text-sm text-paper/70 mb-2">Remind me</label>
                  <select
                    value={formData.reminderDays}
                    onChange={(e) => setFormData({ ...formData, reminderDays: parseInt(e.target.value) })}
                    className="input w-full"
                  >
                    <option value={1}>1 day before</option>
                    <option value={3}>3 days before</option>
                    <option value={7}>1 week before</option>
                    <option value={14}>2 weeks before</option>
                    <option value={30}>1 month before</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-paper/70 mb-2">Memory Prompt (optional)</label>
                  <textarea
                    value={formData.promptSuggestion}
                    onChange={(e) => setFormData({ ...formData, promptSuggestion: e.target.value })}
                    placeholder="e.g., Share a favorite memory of Mom..."
                    className="input w-full h-20 resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => createMutation.mutate()}
                    disabled={!formData.name.trim() || !formData.date || createMutation.isPending}
                    className="btn btn-primary flex-1"
                  >
                    {createMutation.isPending ? 'Adding...' : 'Add Milestone'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
