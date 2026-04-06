import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Pen, Mic, Image, Heart, Sparkles } from './Icons';

const dailyPrompts = [
  { text: "What's a smell that instantly takes you back to childhood?", icon: Pen, action: '/compose', category: 'reflection' },
  { text: "Record a message for someone you love today.", icon: Mic, action: '/record', category: 'voice' },
  { text: "Share a photo from a moment that changed everything.", icon: Image, action: '/memories', category: 'memory' },
  { text: "Write about the person who shaped you most.", icon: Pen, action: '/compose', category: 'reflection' },
  { text: "What would you tell your younger self?", icon: Mic, action: '/record', category: 'voice' },
  { text: "Capture the recipe your family always made together.", icon: Pen, action: '/compose', category: 'tradition' },
  { text: "Record the story behind your name.", icon: Mic, action: '/record', category: 'identity' },
  { text: "What tradition do you want to pass on?", icon: Pen, action: '/compose', category: 'tradition' },
  { text: "Share the funniest family story you know.", icon: Mic, action: '/record', category: 'humour' },
  { text: "Upload a photo of your favourite place on Earth.", icon: Image, action: '/memories', category: 'memory' },
  { text: "Write a letter to someone who will read it years from now.", icon: Pen, action: '/compose', category: 'legacy' },
  { text: "What does home mean to you? Record your answer.", icon: Mic, action: '/record', category: 'reflection' },
  { text: "Share a photo that represents your happiest day.", icon: Image, action: '/memories', category: 'memory' },
  { text: "What life lesson took you the longest to learn?", icon: Pen, action: '/compose', category: 'wisdom' },
  { text: "Record a bedtime story you were told as a child.", icon: Mic, action: '/record', category: 'tradition' },
  { text: "What's the bravest thing you've ever done?", icon: Pen, action: '/compose', category: 'courage' },
  { text: "Record your favourite lullaby or song.", icon: Mic, action: '/record', category: 'voice' },
  { text: "What moment are you most grateful for?", icon: Heart, action: '/compose', category: 'gratitude' },
  { text: "Share a photo of someone who inspires you.", icon: Image, action: '/memories', category: 'memory' },
  { text: "What do you hope your family remembers about you?", icon: Pen, action: '/compose', category: 'legacy' },
  { text: "Record the sounds of your everyday life.", icon: Mic, action: '/record', category: 'voice' },
  { text: "Write about a turning point in your life.", icon: Pen, action: '/compose', category: 'milestone' },
  { text: "What's a family joke only your family understands?", icon: Pen, action: '/compose', category: 'humour' },
  { text: "Record advice for your children or future family.", icon: Mic, action: '/record', category: 'wisdom' },
  { text: "Share a photo from a celebration you'll never forget.", icon: Image, action: '/memories', category: 'memory' },
  { text: "What's the most important thing love has taught you?", icon: Heart, action: '/compose', category: 'love' },
  { text: "Record your morning routine in your own words.", icon: Mic, action: '/record', category: 'daily' },
  { text: "Write about the place where you grew up.", icon: Pen, action: '/compose', category: 'memory' },
  { text: "What would you put in a time capsule today?", icon: Sparkles, action: '/time-capsules', category: 'capsule' },
  { text: "Record a thank-you message for someone special.", icon: Mic, action: '/record', category: 'gratitude' },
];

function getDailyPrompt() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  return dailyPrompts[dayOfYear % dailyPrompts.length];
}

export function QuickActionCard() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState(getDailyPrompt);

  useEffect(() => {
    setPrompt(getDailyPrompt());
  }, []);

  const Icon = prompt.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass rounded-2xl p-6 border border-gold-20 cursor-pointer hover:border-gold/40 transition-all duration-300 group"
      onClick={() => navigate(prompt.action)}
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gold-10 flex items-center justify-center flex-shrink-0 group-hover:bg-gold/20 transition-colors">
          <Icon size={24} className="text-gold" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-display tracking-[0.15em] uppercase text-gold/70 mb-1">
            Today's Prompt
          </p>
          <p className="font-serif text-paper text-lg leading-relaxed">
            {prompt.text}
          </p>
          <p className="text-paper-40 text-sm mt-2 group-hover:text-gold/60 transition-colors">
            Tap to start &rarr;
          </p>
        </div>
      </div>
    </motion.div>
  );
}
