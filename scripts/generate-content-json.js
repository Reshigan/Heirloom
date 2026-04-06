#!/usr/bin/env node
/**
 * Generates scripts/content/all-posts.json with all 60 posts (12 weeks x 5/week).
 * Also generates per-week files: scripts/content/week-{N}.json for bulk loading.
 *
 * Usage: node scripts/generate-content-json.js
 */

const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, 'content');
if (!fs.existsSync(CONTENT_DIR)) fs.mkdirSync(CONTENT_DIR, { recursive: true });

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const PILLARS = ['educational', 'emotional', 'demo', 'engagement', 'viral'];
const PLATFORMS = ['tiktok', 'instagram', 'facebook', 'twitter', 'linkedin', 'youtube', 'threads'];
const HASHTAGS_TIKTOK = '#heirloom #familylegacy #preservememories #voicerecording #timecapsule #grieftok #familystories';
const HASHTAGS_IG = '#heirloom #familylegacy #preservememories #voicerecording #timecapsule #digitalmemories #familystories #legacy';
const CTA_SHORT = 'Start free \u2192 link in bio';
const CTA_URL = 'Start free \u2192 heirloom.blue';

// ---- Week themes and post outlines ----
const WEEKS = [
  {
    theme: 'The Hook',
    posts: [
      {
        day: 'monday', pillar: 'educational', title: 'The 87% Stat',
        lines: [
          { text: '87% of people', delay: 0, style: 'stat' },
          { text: 'wish they\'d recorded', delay: 1.5, style: 'headline' },
          { text: 'a loved one\'s voice', delay: 2.5, style: 'headline gold' },
          { text: 'before it was too late.', delay: 4, style: 'body' },
          { text: 'Can you still hear your\ngrandmother\'s laugh?', delay: 6, style: 'body' },
          { text: 'Will your grandchildren\nhear yours?', delay: 9, style: 'headline gold' },
          { text: 'Record your voice.\nWrite time-locked letters.\nPreserve your story.', delay: 12, style: 'body' },
        ],
        duration: 35, endCardDelay: 28,
        captions: {
          tiktok: `87% of people wish they'd recorded a loved one's voice before it was too late. Don't be one of them. ${CTA_SHORT}\n\n${HASHTAGS_TIKTOK}`,
          instagram: `87% of people wish they'd recorded a loved one's voice before it was too late.\n\nCan you still hear your grandmother's laugh? Will your grandchildren hear yours?\n\nRecord your voice. Write time-locked letters. Preserve your story.\n\n${CTA_URL}\n\n${HASHTAGS_IG}`,
          facebook: `87% of people wish they'd recorded a loved one's voice before it was too late.\n\nCan you still hear your grandmother's laugh? Will your grandchildren hear yours?\n\nHeirloom lets you record your voice, write letters that arrive in the future, and preserve photos \u2014 all encrypted and delivered on your terms.\n\n${CTA_URL}`,
          twitter: `87% of people wish they'd recorded a loved one's voice before they passed.\n\nCan you still hear your grandmother's laugh?\n\nWill your grandchildren hear yours?\n\nRecord it. Preserve it. heirloom.blue`,
          linkedin: `I recently came across a statistic that stopped me cold: 87% of people wish they'd recorded a loved one's voice before it was too late.\n\nThat's why we built Heirloom \u2014 a platform where you record your voice, write time-locked letters, and preserve photos for future generations. End-to-end encrypted. Delivered on your terms.\n\n${CTA_URL}`,
          youtube_title: `87% of People Wish They'd Recorded This | Heirloom`,
          youtube_description: `87% of people wish they'd recorded a loved one's voice before it was too late. Don't let your voice disappear.\n\nStart free \u2192 https://heirloom.blue`,
          threads: `87% of people wish they'd recorded a loved one's voice before it was too late.\n\nCan you still hear your grandmother's laugh?\n\nWill your grandchildren hear yours?\n\n${CTA_URL}`,
        },
      },
      {
        day: 'tuesday', pillar: 'emotional', title: 'The Forgotten Melody',
        lines: [
          { text: 'My grandmother', delay: 0, style: 'body' },
          { text: 'used to sing me to sleep.', delay: 2, style: 'headline' },
          { text: 'She had this song.', delay: 5, style: 'body' },
          { text: 'I can\'t remember\nthe melody anymore.', delay: 7.5, style: 'headline' },
          { text: 'She\'s been gone 11 years.', delay: 11, style: 'body' },
          { text: 'I would give anything...', delay: 14, style: 'headline gold' },
          { text: '...anything...', delay: 17, style: 'headline gold' },
          { text: 'to hear her sing it\none more time.', delay: 19.5, style: 'headline' },
          { text: 'Don\'t let their voice\ndisappear.', delay: 24, style: 'headline gold' },
        ],
        duration: 42, endCardDelay: 34,
        captions: {
          tiktok: `Don't let their voice disappear. Record it today. ${CTA_SHORT}\n\n${HASHTAGS_TIKTOK}`,
          instagram: `My grandmother used to sing me to sleep. She had this song.\n\nI can't remember the melody anymore. She's been gone 11 years.\n\nI would give anything to hear her sing it one more time.\n\nDon't let their voice disappear.\n\n${CTA_URL}\n\n${HASHTAGS_IG}`,
          facebook: `My grandmother used to sing me to sleep. She had this song. I can't remember the melody anymore.\n\nShe's been gone 11 years. I would give anything to hear her sing it one more time.\n\nDon't let their voice disappear. Record it today.\n\n${CTA_URL}`,
          twitter: `My grandmother used to sing me to sleep.\n\nI can't remember the melody anymore. She's been gone 11 years.\n\nI would give anything to hear it one more time.\n\nDon't let their voice disappear. heirloom.blue`,
          linkedin: `A personal reflection that drives everything we're building.\n\nMy grandmother used to sing me to sleep. I can't remember the melody anymore. She's been gone 11 years.\n\nThis is why Heirloom exists \u2014 so no one has to lose those voices.\n\n${CTA_URL}`,
          youtube_title: `I Can't Remember Her Voice Anymore | Heirloom`,
          youtube_description: `Don't let their voice disappear. Record it today.\n\nStart free \u2192 https://heirloom.blue`,
          threads: `My grandmother used to sing me to sleep.\n\nI can't remember the melody anymore. She's been gone 11 years.\n\nDon't let their voice disappear.\n\n${CTA_URL}`,
        },
      },
      {
        day: 'wednesday', pillar: 'demo', title: '3 Steps, Forever',
        lines: [
          { text: '3 steps.', delay: 0, style: 'stat' },
          { text: '60 seconds.', delay: 1.5, style: 'headline' },
          { text: 'A voice that lives forever.', delay: 3, style: 'headline gold' },
          { text: 'Step 1', delay: 6, style: 'stat' },
          { text: 'Pick a prompt.\n"Tell your grandchild about\nthe day they were born."', delay: 7, style: 'body' },
          { text: 'Step 2', delay: 12, style: 'stat' },
          { text: 'Press record.\nJust talk.', delay: 13, style: 'body' },
          { text: 'Step 3', delay: 17, style: 'stat' },
          { text: 'Choose when they hear it.\nOn their 18th birthday.\nOn their wedding day.\nAfter you\'re gone.', delay: 18, style: 'body' },
          { text: 'Encrypted. Delivered.\nYours forever.', delay: 25, style: 'headline gold' },
        ],
        duration: 38, endCardDelay: 30,
        captions: {
          tiktok: `3 steps. 60 seconds. A voice that lives forever. Try it free \u2192 link in bio\n\n${HASHTAGS_TIKTOK}`,
          instagram: `3 steps. 60 seconds. A voice that lives forever.\n\n1\uFE0F\u20E3 Pick a prompt\n2\uFE0F\u20E3 Press record\n3\uFE0F\u20E3 Choose when they hear it\n\nEncrypted. Delivered. Yours forever.\n\n${CTA_URL}\n\n${HASHTAGS_IG}`,
          facebook: `3 steps. 60 seconds. A voice that lives forever.\n\nStep 1: Pick a prompt \u2014 "Tell your grandchild about the day they were born."\nStep 2: Press record. Just talk.\nStep 3: Choose when they hear it. On their 18th birthday. After you're gone.\n\n${CTA_URL}`,
          twitter: `3 steps. 60 seconds. A voice that lives forever.\n\n1. Pick a prompt\n2. Press record\n3. Choose when they hear it\n\nTry it free \u2192 heirloom.blue`,
          linkedin: `We designed Heirloom to take 60 seconds.\n\nStep 1: Pick a guided prompt.\nStep 2: Press record. Just talk.\nStep 3: Choose when they hear it \u2014 a birthday, a wedding, or after you're gone.\n\nEncrypted. Delivered. Forever.\n\n${CTA_URL}`,
          youtube_title: `3 Steps to Preserve Your Voice Forever | Heirloom Demo`,
          youtube_description: `See how easy it is to preserve your voice, letters, and photos with Heirloom.\n\nStart free \u2192 https://heirloom.blue`,
          threads: `3 steps. 60 seconds. A voice that lives forever.\n\n1. Pick a prompt\n2. Press record\n3. Choose when they hear it\n\n${CTA_URL}`,
        },
      },
      {
        day: 'thursday', pillar: 'engagement', title: 'Who Would You Hear Again?',
        lines: [
          { text: 'If you could hear\none person\'s voice\nagain...', delay: 0, style: 'headline' },
          { text: 'who would it be?', delay: 3, style: 'headline gold' },
          { text: 'Comment below \u2B07\uFE0F', delay: 6, style: 'body' },
        ],
        duration: 12, endCardDelay: 9,
        captions: {
          tiktok: `If you could hear one person's voice one more time \u2014 who would it be? Comment below \u2B07\uFE0F\n\n${HASHTAGS_TIKTOK}`,
          instagram: `If you could hear one person's voice one more time \u2014 who would it be?\n\nComment below \u2B07\uFE0F\n\n${HASHTAGS_IG}`,
          facebook: `If you could hear one person's voice one more time \u2014 who would it be?\n\nComment below \u2B07\uFE0F`,
          twitter: `If you could hear one person's voice one more time \u2014 who would it be?`,
          linkedin: `A question I ask everyone I meet:\n\nIf you could hear one person's voice one more time \u2014 who would it be?\n\nShare in the comments.`,
          youtube_title: `Who Would You Hear Again? | Heirloom`,
          youtube_description: `If you could hear one person's voice one more time \u2014 who would it be? Comment below.\n\nStart free \u2192 https://heirloom.blue`,
          threads: `If you could hear one person's voice one more time \u2014 who would it be? \u2B07\uFE0F`,
        },
      },
      {
        day: 'friday', pillar: 'viral', title: '6 Out of 10',
        lines: [
          { text: '6 out of 10', delay: 0, style: 'stat' },
          { text: 'people have zero recordings\nof their grandparents.', delay: 1.5, style: 'headline' },
          { text: 'Not a single voice note.', delay: 5, style: 'body' },
          { text: 'Not a video.', delay: 7, style: 'body' },
          { text: 'Nothing.', delay: 8.5, style: 'headline gold' },
          { text: 'In 50 years, your\ngrandchildren will feel\nthe same way about you.', delay: 11, style: 'headline' },
          { text: 'Unless you do something\nabout it today.', delay: 16, style: 'headline gold' },
        ],
        duration: 25, endCardDelay: 20,
        captions: {
          tiktok: `6 out of 10 people have ZERO recordings of their grandparents. Send this to someone who needs to see it. ${CTA_SHORT}\n\n${HASHTAGS_TIKTOK}`,
          instagram: `6 out of 10 people have zero recordings of their grandparents.\n\nNot a single voice note. Not a video. Nothing.\n\nIn 50 years, your grandchildren will feel the same way about you.\n\nUnless you do something about it today.\n\n${CTA_URL}\n\n${HASHTAGS_IG}`,
          facebook: `6 out of 10 people have zero recordings of their grandparents. Not a single voice note. Not a video. Nothing.\n\nIn 50 years, your grandchildren will feel the same way about you. Unless you do something about it today.\n\n${CTA_URL}`,
          twitter: `6 out of 10 people have zero recordings of their grandparents.\n\nNot a voice note. Not a video. Nothing.\n\nIn 50 years, your grandchildren will feel the same about you.\n\nheirloom.blue`,
          linkedin: `Here's a statistic that should concern every parent and grandparent:\n\n6 out of 10 people have zero recordings of their grandparents. Not a voice note. Not a video. Nothing.\n\nWe built Heirloom to change that.\n\n${CTA_URL}`,
          youtube_title: `6 Out of 10 People Have ZERO Recordings of Their Grandparents`,
          youtube_description: `The statistic that made us build Heirloom. Don't let your voice disappear.\n\nStart free \u2192 https://heirloom.blue`,
          threads: `6 out of 10 people have zero recordings of their grandparents.\n\nNot a voice note. Not a video. Nothing.\n\nDon't be a statistic.\n\n${CTA_URL}`,
        },
      },
    ],
  },
  {
    theme: 'The Fear',
    posts: [
      {
        day: 'monday', pillar: 'educational', title: 'The 6 Voices',
        lines: [
          { text: 'The average person', delay: 0, style: 'body' },
          { text: 'loses 4 grandparents\nand 2 parents.', delay: 2, style: 'headline' },
          { text: 'That\'s 6 voices', delay: 5, style: 'stat' },
          { text: 'gone forever.', delay: 7, style: 'headline gold' },
          { text: 'How many can you\nstill hear?', delay: 10, style: 'headline' },
        ],
        duration: 20, endCardDelay: 15,
      },
      {
        day: 'tuesday', pillar: 'emotional', title: 'A Letter Has Arrived',
        lines: [
          { text: '\uD83D\uDD14 Notification', delay: 0, style: 'body' },
          { text: '"A Letter Has Arrived"', delay: 2, style: 'headline gold' },
          { text: 'From Grandma Rose', delay: 4.5, style: 'headline' },
          { text: 'Written 3 years ago.', delay: 7, style: 'body' },
          { text: 'Delivered today.', delay: 9, style: 'headline gold' },
          { text: 'She knew you\'d need it\nright now.', delay: 12, style: 'headline' },
        ],
        duration: 22, endCardDelay: 17,
      },
      {
        day: 'wednesday', pillar: 'demo', title: 'POV: Grandma\'s Voice',
        lines: [
          { text: 'POV:', delay: 0, style: 'body' },
          { text: 'You discover your grandmother\nleft you a voice message', delay: 1.5, style: 'headline' },
          { text: 'on Heirloom.', delay: 4, style: 'headline gold' },
          { text: 'Recorded 2 years ago.', delay: 6.5, style: 'body' },
          { text: 'Set to deliver\nafter she was gone.', delay: 9, style: 'headline' },
          { text: 'You press play...', delay: 12, style: 'headline gold' },
        ],
        duration: 20, endCardDelay: 16,
      },
      {
        day: 'thursday', pillar: 'engagement', title: 'Netflix vs Voice',
        lines: [
          { text: 'Your kids won\'t remember', delay: 0, style: 'body' },
          { text: 'your Netflix password.', delay: 2.5, style: 'headline' },
          { text: 'They\'ll remember', delay: 5, style: 'body' },
          { text: 'your voice.', delay: 7, style: 'headline gold' },
          { text: 'Record it today.', delay: 10, style: 'headline' },
        ],
        duration: 18, endCardDelay: 14,
      },
      {
        day: 'friday', pillar: 'viral', title: 'The #1 Regret',
        lines: [
          { text: 'I asked 100 people:', delay: 0, style: 'body' },
          { text: 'What do you regret most?', delay: 2, style: 'headline' },
          { text: '#1 answer:', delay: 5, style: 'stat' },
          { text: 'Not recording\ntheir voice.', delay: 7, style: 'headline gold' },
          { text: 'Don\'t wait.', delay: 11, style: 'headline' },
        ],
        duration: 18, endCardDelay: 14,
      },
    ],
  },
  {
    theme: 'The Solution',
    posts: [
      {
        day: 'monday', pillar: 'educational', title: '5 Things to Record',
        lines: [
          { text: '5 things to record', delay: 0, style: 'headline' },
          { text: 'before it\'s too late:', delay: 2, style: 'headline gold' },
          { text: '1. Their laugh', delay: 4, style: 'body' },
          { text: '2. Their favourite story', delay: 6, style: 'body' },
          { text: '3. Their advice for you', delay: 8, style: 'body' },
          { text: '4. Their "I love you"', delay: 10, style: 'body' },
          { text: '5. Their singing voice', delay: 12, style: 'body' },
          { text: 'Start today.\nNot tomorrow.', delay: 15, style: 'headline gold' },
        ],
        duration: 25, endCardDelay: 20,
      },
      {
        day: 'tuesday', pillar: 'emotional', title: 'Time-Locked Letter',
        lines: [
          { text: 'Written 2021.', delay: 0, style: 'body' },
          { text: 'Delivered 2027.', delay: 2.5, style: 'headline gold' },
          { text: 'A letter from a father\nto his daughter.', delay: 5, style: 'headline' },
          { text: 'Sealed for her\n18th birthday.', delay: 8, style: 'body' },
          { text: 'She\'ll open it\nnot knowing what\'s inside.', delay: 11, style: 'headline' },
          { text: 'But he knew\nexactly what she\'d need\nto hear.', delay: 15, style: 'headline gold' },
        ],
        duration: 28, endCardDelay: 22,
      },
      {
        day: 'wednesday', pillar: 'demo', title: 'With vs Without',
        lines: [
          { text: 'Without Heirloom:', delay: 0, style: 'headline' },
          { text: 'Memories fade.\nVoices are forgotten.\nStories die.', delay: 2, style: 'body' },
          { text: 'With Heirloom:', delay: 6, style: 'headline gold' },
          { text: 'Voices are preserved.\nLetters arrive in the future.\nStories live forever.', delay: 8, style: 'body' },
          { text: 'The choice is yours.', delay: 13, style: 'headline' },
        ],
        duration: 22, endCardDelay: 17,
      },
      {
        day: 'thursday', pillar: 'engagement', title: 'Voice or $10,000',
        lines: [
          { text: 'Your grandmother\'s voice', delay: 0, style: 'headline' },
          { text: 'or $10,000.', delay: 3, style: 'stat' },
          { text: 'Which would you choose?', delay: 5, style: 'headline gold' },
          { text: 'Comment below \u2B07\uFE0F', delay: 8, style: 'body' },
        ],
        duration: 14, endCardDelay: 11,
      },
      {
        day: 'friday', pillar: 'viral', title: 'Record RIGHT NOW',
        lines: [
          { text: 'Record a 60-second message', delay: 0, style: 'headline' },
          { text: 'for your child.', delay: 2.5, style: 'headline gold' },
          { text: 'Do it', delay: 5, style: 'headline' },
          { text: 'RIGHT NOW.', delay: 6.5, style: 'stat' },
          { text: 'Not later.\nNot tomorrow.\nNow.', delay: 9, style: 'body' },
        ],
        duration: 18, endCardDelay: 14,
      },
    ],
  },
  {
    theme: 'Social Proof',
    posts: [
      {
        day: 'monday', pillar: 'demo', title: 'How It Works (60s)',
        lines: [
          { text: 'How Heirloom works', delay: 0, style: 'headline' },
          { text: 'in 60 seconds:', delay: 2, style: 'headline gold' },
          { text: '\u2776 Record your voice', delay: 4, style: 'body' },
          { text: '\u2777 Write time-locked letters', delay: 7, style: 'body' },
          { text: '\u2778 Upload precious photos', delay: 10, style: 'body' },
          { text: '\u2779 Set delivery triggers', delay: 13, style: 'body' },
          { text: '\u277A End-to-end encrypted', delay: 16, style: 'body' },
          { text: 'Your family receives\neverything.\nOn your terms.', delay: 19, style: 'headline gold' },
        ],
        duration: 30, endCardDelay: 25,
      },
      {
        day: 'tuesday', pillar: 'emotional', title: 'Mother\'s Recording',
        lines: [
          { text: 'I recorded my mother', delay: 0, style: 'body' },
          { text: '6 months before she passed.', delay: 2.5, style: 'headline' },
          { text: 'My daughter', delay: 6, style: 'body' },
          { text: 'plays it every night.', delay: 7.5, style: 'headline gold' },
          { text: 'She never met her grandmother.', delay: 11, style: 'headline' },
          { text: 'But she knows her voice.', delay: 14, style: 'headline gold' },
        ],
        duration: 24, endCardDelay: 19,
      },
      {
        day: 'wednesday', pillar: 'educational', title: 'Heirloom vs StoryWorth',
        lines: [
          { text: 'Heirloom vs StoryWorth', delay: 0, style: 'headline' },
          { text: 'Voice recording?', delay: 3, style: 'body' },
          { text: 'Heirloom: Yes\nStoryWorth: No', delay: 4.5, style: 'headline gold' },
          { text: 'Time-locked delivery?', delay: 7, style: 'body' },
          { text: 'Heirloom: Yes\nStoryWorth: No', delay: 8.5, style: 'headline gold' },
          { text: 'End-to-end encryption?', delay: 11, style: 'body' },
          { text: 'Heirloom: Yes\nStoryWorth: No', delay: 12.5, style: 'headline gold' },
          { text: 'Free tier?', delay: 15, style: 'body' },
          { text: 'Heirloom: Yes\nStoryWorth: $99/year', delay: 16.5, style: 'headline gold' },
        ],
        duration: 28, endCardDelay: 22,
      },
      {
        day: 'thursday', pillar: 'engagement', title: 'Tag Someone',
        lines: [
          { text: 'Tag someone', delay: 0, style: 'headline' },
          { text: 'who should record', delay: 2, style: 'body' },
          { text: 'their grandparents.', delay: 4, style: 'headline gold' },
          { text: 'Before it\'s too late.', delay: 7, style: 'headline' },
        ],
        duration: 14, endCardDelay: 10,
      },
      {
        day: 'friday', pillar: 'viral', title: 'Every 6 Seconds',
        lines: [
          { text: 'Every 6 seconds,', delay: 0, style: 'stat' },
          { text: 'someone loses a grandparent.', delay: 2, style: 'headline' },
          { text: 'Every 6 seconds,', delay: 5, style: 'stat' },
          { text: 'a voice disappears\nforever.', delay: 7, style: 'headline gold' },
          { text: 'Don\'t let yours\nbe next.', delay: 11, style: 'headline' },
        ],
        duration: 20, endCardDelay: 15,
      },
    ],
  },
  {
    theme: 'Voice Recording Deep Dive',
    posts: [
      {
        day: 'monday', pillar: 'educational', title: '10 Questions',
        lines: [
          { text: '10 questions to ask', delay: 0, style: 'headline' },
          { text: 'your parents this weekend:', delay: 2, style: 'headline gold' },
          { text: '1. How did you and Mom/Dad meet?', delay: 4, style: 'body' },
          { text: '2. What was I like as a baby?', delay: 6, style: 'body' },
          { text: '3. What\'s your happiest memory?', delay: 8, style: 'body' },
          { text: '4. What would you tell your 20-year-old self?', delay: 10, style: 'body' },
          { text: '5. What\'s the best advice you got?', delay: 12, style: 'body' },
          { text: 'Record the answers.', delay: 15, style: 'headline gold' },
        ],
        duration: 25, endCardDelay: 20,
      },
      {
        day: 'tuesday', pillar: 'emotional', title: 'Father\'s Voice for Newborn',
        lines: [
          { text: 'I played my late father\'s\nvoice recording', delay: 0, style: 'headline' },
          { text: 'for my newborn son.', delay: 3.5, style: 'headline gold' },
          { text: 'He\'ll never meet his grandfather.', delay: 7, style: 'body' },
          { text: 'But he\'ll know his voice.', delay: 10, style: 'headline' },
          { text: 'His stories.', delay: 13, style: 'body' },
          { text: 'His love.', delay: 14.5, style: 'headline gold' },
        ],
        duration: 24, endCardDelay: 19,
      },
      {
        day: 'wednesday', pillar: 'demo', title: 'Interview Mode',
        lines: [
          { text: 'Interview Mode', delay: 0, style: 'headline gold' },
          { text: 'Guided conversations that\ncapture stories naturally.', delay: 2.5, style: 'headline' },
          { text: 'You pick a topic.', delay: 6, style: 'body' },
          { text: 'Heirloom asks the questions.', delay: 8, style: 'body' },
          { text: 'You just talk.', delay: 10, style: 'headline gold' },
          { text: 'No awkward silence.\nNo "what should I say?"', delay: 13, style: 'body' },
          { text: 'Just stories,\npreserved forever.', delay: 17, style: 'headline' },
        ],
        duration: 28, endCardDelay: 22,
      },
      {
        day: 'thursday', pillar: 'engagement', title: 'First Recording Poll',
        lines: [
          { text: 'What\'s the first thing', delay: 0, style: 'headline' },
          { text: 'you\'d record?', delay: 2.5, style: 'headline gold' },
          { text: 'A) Your laugh', delay: 5, style: 'body' },
          { text: 'B) A bedtime story', delay: 7, style: 'body' },
          { text: 'C) Life advice', delay: 9, style: 'body' },
          { text: 'D) "I love you"', delay: 11, style: 'body' },
        ],
        duration: 18, endCardDelay: 14,
      },
      {
        day: 'friday', pillar: 'viral', title: 'Voice Fades First',
        lines: [
          { text: 'The voice fades first.', delay: 0, style: 'headline' },
          { text: 'Then the face.', delay: 3, style: 'body' },
          { text: 'Then the stories.', delay: 5, style: 'body' },
          { text: 'Record them all.', delay: 8, style: 'headline gold' },
        ],
        duration: 16, endCardDelay: 12,
      },
    ],
  },
  {
    theme: 'Letters Deep Dive',
    posts: [
      {
        day: 'monday', pillar: 'educational', title: 'Legacy Letter Prompts',
        lines: [
          { text: 'How to write\na legacy letter:', delay: 0, style: 'headline' },
          { text: '5 prompts that work.', delay: 3, style: 'headline gold' },
          { text: '1. "The day you were born..."', delay: 5.5, style: 'body' },
          { text: '2. "What I hope for your future..."', delay: 8, style: 'body' },
          { text: '3. "The lesson I learned too late..."', delay: 10.5, style: 'body' },
          { text: '4. "When I look at you, I see..."', delay: 13, style: 'body' },
          { text: '5. "If I could give you one thing..."', delay: 15.5, style: 'body' },
        ],
        duration: 25, endCardDelay: 20,
      },
      {
        day: 'tuesday', pillar: 'emotional', title: 'Wax Seal',
        lines: [
          { text: '\u2728 Sealed', delay: 0, style: 'headline gold' },
          { text: 'until your graduation day,', delay: 2, style: 'headline' },
          { text: '2032.', delay: 4.5, style: 'stat' },
          { text: 'A letter from your father.', delay: 7, style: 'body' },
          { text: 'Written when you were 10.', delay: 9.5, style: 'body' },
          { text: 'He knew then\nwhat you\'d need to hear.', delay: 12, style: 'headline gold' },
        ],
        duration: 22, endCardDelay: 17,
      },
      {
        day: 'wednesday', pillar: 'demo', title: 'Time-Locked Letters',
        lines: [
          { text: 'Time-locked letters:', delay: 0, style: 'headline gold' },
          { text: 'Set delivery for:', delay: 2.5, style: 'headline' },
          { text: 'Birthdays', delay: 4.5, style: 'body' },
          { text: 'Weddings', delay: 6, style: 'body' },
          { text: 'Graduations', delay: 7.5, style: 'body' },
          { text: 'Or after you\'re gone.', delay: 9.5, style: 'headline gold' },
          { text: 'Encrypted until delivery.\nNo one reads it early.', delay: 12, style: 'body' },
        ],
        duration: 22, endCardDelay: 17,
      },
      {
        day: 'thursday', pillar: 'engagement', title: 'Letter From Anyone',
        lines: [
          { text: 'If you could receive\na letter', delay: 0, style: 'headline' },
          { text: 'from anyone who passed \u2014', delay: 3, style: 'body' },
          { text: 'who?', delay: 5.5, style: 'headline gold' },
          { text: 'Comment below \u2B07\uFE0F', delay: 8, style: 'body' },
        ],
        duration: 14, endCardDelay: 11,
      },
      {
        day: 'friday', pillar: 'viral', title: 'Write One Letter',
        lines: [
          { text: 'Write one letter today.', delay: 0, style: 'headline' },
          { text: 'It takes 5 minutes.', delay: 3, style: 'body' },
          { text: 'It lasts forever.', delay: 5.5, style: 'headline gold' },
        ],
        duration: 12, endCardDelay: 9,
      },
    ],
  },
  {
    theme: 'Time Capsules',
    posts: [
      {
        day: 'monday', pillar: 'educational', title: 'Family Time Capsules',
        lines: [
          { text: 'Family Time Capsules:', delay: 0, style: 'headline gold' },
          { text: 'Everyone contributes.', delay: 2.5, style: 'headline' },
          { text: 'Nobody opens', delay: 5, style: 'body' },
          { text: 'until 2044.', delay: 6.5, style: 'stat' },
          { text: 'Voice messages.\nLetters.\nPhotos.', delay: 9, style: 'body' },
          { text: 'All sealed.\nAll encrypted.\nAll waiting.', delay: 13, style: 'headline gold' },
        ],
        duration: 24, endCardDelay: 19,
      },
      {
        day: 'tuesday', pillar: 'emotional', title: 'Daughter\'s 18th',
        lines: [
          { text: 'We sealed a capsule', delay: 0, style: 'headline' },
          { text: 'for our daughter.', delay: 2.5, style: 'body' },
          { text: 'She opens it', delay: 5, style: 'headline' },
          { text: 'on her 18th birthday.', delay: 7, style: 'headline gold' },
          { text: 'Messages from every family member.', delay: 10, style: 'body' },
          { text: 'Written when she was 3.', delay: 13, style: 'headline' },
          { text: 'She has no idea.', delay: 16, style: 'headline gold' },
        ],
        duration: 26, endCardDelay: 21,
      },
      {
        day: 'wednesday', pillar: 'demo', title: 'Create a Capsule',
        lines: [
          { text: 'How to create\na Family Time Capsule:', delay: 0, style: 'headline' },
          { text: '1. Name your capsule', delay: 3, style: 'body' },
          { text: '2. Invite family members', delay: 5.5, style: 'body' },
          { text: '3. Everyone adds messages', delay: 8, style: 'body' },
          { text: '4. Seal it', delay: 10.5, style: 'headline gold' },
          { text: '5. Wait.', delay: 13, style: 'headline' },
          { text: 'Free. Encrypted.\nPriceless.', delay: 16, style: 'headline gold' },
        ],
        duration: 26, endCardDelay: 21,
      },
      {
        day: 'thursday', pillar: 'engagement', title: 'Future Grandchild',
        lines: [
          { text: 'What would you put', delay: 0, style: 'headline' },
          { text: 'in a time capsule', delay: 2, style: 'body' },
          { text: 'for your future grandchild?', delay: 4, style: 'headline gold' },
          { text: 'Comment \u2B07\uFE0F', delay: 7, style: 'body' },
        ],
        duration: 14, endCardDelay: 10,
      },
      {
        day: 'friday', pillar: 'viral', title: 'New Feature: Capsules',
        lines: [
          { text: 'NEW', delay: 0, style: 'stat' },
          { text: 'Family Time Capsules.', delay: 2, style: 'headline gold' },
          { text: 'Create one now \u2014 free.', delay: 5, style: 'headline' },
          { text: 'Invite your whole family.', delay: 8, style: 'body' },
          { text: 'Seal it.\nOpen it in 2044.', delay: 10.5, style: 'headline gold' },
        ],
        duration: 18, endCardDelay: 14,
      },
    ],
  },
  {
    theme: 'Security & Trust',
    posts: [
      {
        day: 'monday', pillar: 'educational', title: 'E2E Encryption',
        lines: [
          { text: 'End-to-end encryption', delay: 0, style: 'headline gold' },
          { text: 'explained in 30 seconds:', delay: 2, style: 'headline' },
          { text: 'Your content is encrypted\non YOUR device.', delay: 4.5, style: 'body' },
          { text: 'Only YOU hold the key.', delay: 8, style: 'headline' },
          { text: 'We can\'t read it.', delay: 11, style: 'body' },
          { text: 'Hackers can\'t read it.', delay: 13, style: 'body' },
          { text: 'Nobody can.', delay: 15, style: 'headline gold' },
          { text: 'Your memories.\nYour keys.\nYour rules.', delay: 18, style: 'headline' },
        ],
        duration: 28, endCardDelay: 23,
      },
      {
        day: 'tuesday', pillar: 'emotional', title: 'Dead Man\'s Switch',
        lines: [
          { text: 'The Dead Man\'s Switch:', delay: 0, style: 'headline gold' },
          { text: 'How your family\ngets your memories', delay: 2.5, style: 'headline' },
          { text: 'after you\'re gone.', delay: 5.5, style: 'body' },
          { text: 'You set a check-in schedule.', delay: 8, style: 'body' },
          { text: 'If you stop checking in...', delay: 10.5, style: 'headline' },
          { text: 'Your trusted contacts verify.', delay: 13, style: 'body' },
          { text: 'Then your family receives\neverything you preserved.', delay: 16, style: 'headline gold' },
          { text: 'Automatic. Secure.\nDignified.', delay: 20, style: 'headline' },
        ],
        duration: 30, endCardDelay: 25,
      },
      {
        day: 'wednesday', pillar: 'demo', title: 'Zero Knowledge',
        lines: [
          { text: 'Zero-knowledge\narchitecture:', delay: 0, style: 'headline gold' },
          { text: 'We can\'t see\nyour content.', delay: 3, style: 'headline' },
          { text: 'Nobody can.', delay: 6, style: 'body' },
          { text: 'Your device encrypts.\nYour key decrypts.', delay: 8, style: 'body' },
          { text: 'Even if our servers\nwere breached...', delay: 12, style: 'headline' },
          { text: 'your memories stay safe.', delay: 15, style: 'headline gold' },
        ],
        duration: 24, endCardDelay: 19,
      },
      {
        day: 'thursday', pillar: 'engagement', title: 'Trust Question',
        lines: [
          { text: 'Would you trust\na platform', delay: 0, style: 'headline' },
          { text: 'with your family\'s\nmost precious memories?', delay: 3, style: 'body' },
          { text: 'What would it take?', delay: 7, style: 'headline gold' },
          { text: 'Comment below \u2B07\uFE0F', delay: 10, style: 'body' },
        ],
        duration: 16, endCardDelay: 13,
      },
      {
        day: 'friday', pillar: 'viral', title: 'Your Data, Your Family',
        lines: [
          { text: 'Your data belongs\nto your family.', delay: 0, style: 'headline gold' },
          { text: 'Not to us.', delay: 3.5, style: 'headline' },
          { text: 'Not to advertisers.', delay: 5.5, style: 'headline' },
          { text: 'Not to AI.', delay: 7.5, style: 'headline' },
          { text: 'End-to-end encrypted.\nZero knowledge.\nYours forever.', delay: 10, style: 'body' },
        ],
        duration: 20, endCardDelay: 15,
      },
    ],
  },
  {
    theme: 'The Gift',
    posts: [
      {
        day: 'monday', pillar: 'viral', title: 'Mother\'s Day Gift',
        lines: [
          { text: 'This Mother\'s Day,', delay: 0, style: 'headline' },
          { text: 'don\'t buy flowers.', delay: 2.5, style: 'body' },
          { text: 'Record a message', delay: 5, style: 'headline gold' },
          { text: 'that lasts forever.', delay: 7, style: 'headline' },
        ],
        duration: 14, endCardDelay: 11,
      },
      {
        day: 'tuesday', pillar: 'emotional', title: 'Mom Opens Gift',
        lines: [
          { text: 'POV:', delay: 0, style: 'body' },
          { text: 'Your mom opens\na Heirloom gift', delay: 1.5, style: 'headline' },
          { text: 'and hears a message', delay: 4.5, style: 'body' },
          { text: 'from your late grandmother.', delay: 6.5, style: 'headline gold' },
          { text: 'Recorded 2 years ago.', delay: 9.5, style: 'body' },
          { text: 'Delivered today.', delay: 12, style: 'headline gold' },
        ],
        duration: 20, endCardDelay: 16,
      },
      {
        day: 'wednesday', pillar: 'demo', title: 'Gift a Year',
        lines: [
          { text: 'Gift a year of Heirloom:', delay: 0, style: 'headline gold' },
          { text: '$20', delay: 3, style: 'stat' },
          { text: 'for something they\'ll treasure', delay: 5, style: 'headline' },
          { text: 'forever.', delay: 7.5, style: 'headline gold' },
          { text: 'Voice recording.\nLetters.\nPhotos.\nAll encrypted.', delay: 10, style: 'body' },
        ],
        duration: 20, endCardDelay: 16,
      },
      {
        day: 'thursday', pillar: 'engagement', title: 'Flowers vs Voice',
        lines: [
          { text: 'What would your mom\nwant more:', delay: 0, style: 'headline' },
          { text: 'Flowers', delay: 3, style: 'body' },
          { text: 'or your voice saying\n"I love you" forever?', delay: 5, style: 'headline gold' },
          { text: 'Comment \u2B07\uFE0F', delay: 9, style: 'body' },
        ],
        duration: 16, endCardDelay: 12,
      },
      {
        day: 'friday', pillar: 'viral', title: '24 Hours Left',
        lines: [
          { text: '24 hours left.', delay: 0, style: 'stat' },
          { text: 'Gift Heirloom', delay: 2.5, style: 'headline gold' },
          { text: 'before Mother\'s Day.', delay: 4.5, style: 'headline' },
          { text: 'heirloom.blue/gift', delay: 7, style: 'headline gold' },
        ],
        duration: 14, endCardDelay: 10,
      },
    ],
  },
  {
    theme: 'Gifting Continued',
    posts: [
      {
        day: 'monday', pillar: 'viral', title: 'Best Gift: $1/month',
        lines: [
          { text: 'The best gift', delay: 0, style: 'headline' },
          { text: 'costs $1/month', delay: 2.5, style: 'stat' },
          { text: 'and lasts forever.', delay: 5, style: 'headline gold' },
        ],
        duration: 12, endCardDelay: 9,
      },
      {
        day: 'tuesday', pillar: 'emotional', title: 'Gift Unboxing',
        lines: [
          { text: 'Gift unboxing:', delay: 0, style: 'headline' },
          { text: 'What it looks like', delay: 2, style: 'body' },
          { text: 'when someone receives', delay: 4, style: 'body' },
          { text: 'Heirloom.', delay: 6, style: 'headline gold' },
          { text: 'A notification.\nA message from you.\nA lifetime of memories.', delay: 8.5, style: 'headline' },
        ],
        duration: 20, endCardDelay: 15,
      },
      {
        day: 'wednesday', pillar: 'educational', title: '5 Moments to Give',
        lines: [
          { text: '5 moments\nto give Heirloom:', delay: 0, style: 'headline gold' },
          { text: '1. Birthday', delay: 3, style: 'body' },
          { text: '2. Wedding', delay: 5, style: 'body' },
          { text: '3. New baby', delay: 7, style: 'body' },
          { text: '4. Retirement', delay: 9, style: 'body' },
          { text: '5. Mother\'s Day', delay: 11, style: 'body' },
          { text: 'heirloom.blue/gift', delay: 14, style: 'headline gold' },
        ],
        duration: 22, endCardDelay: 18,
      },
      {
        day: 'thursday', pillar: 'engagement', title: 'Who Needs to Record',
        lines: [
          { text: 'Share:', delay: 0, style: 'body' },
          { text: 'Who in your family', delay: 1.5, style: 'headline' },
          { text: 'needs to start recording', delay: 3.5, style: 'body' },
          { text: 'their stories?', delay: 5.5, style: 'headline gold' },
          { text: 'Tag them \u2B07\uFE0F', delay: 8, style: 'body' },
        ],
        duration: 14, endCardDelay: 11,
      },
      {
        day: 'friday', pillar: 'viral', title: 'More Valuable Every Year',
        lines: [
          { text: 'The gift that gets', delay: 0, style: 'headline' },
          { text: 'more valuable', delay: 2.5, style: 'headline gold' },
          { text: 'every year.', delay: 4.5, style: 'headline' },
          { text: 'heirloom.blue/gift', delay: 7, style: 'headline gold' },
        ],
        duration: 14, endCardDelay: 10,
      },
    ],
  },
  {
    theme: 'The Movement',
    posts: [
      {
        day: 'monday', pillar: 'engagement', title: '#HeirloomChallenge',
        lines: [
          { text: '#HeirloomChallenge', delay: 0, style: 'headline gold' },
          { text: 'Record a 30-second message', delay: 3, style: 'headline' },
          { text: 'for someone you love.', delay: 5.5, style: 'body' },
          { text: 'Post it.\nTag them.\nTag us.', delay: 8, style: 'headline' },
        ],
        duration: 16, endCardDelay: 13,
      },
      {
        day: 'tuesday', pillar: 'emotional', title: 'Join the Movement',
        lines: [
          { text: 'Families around the world', delay: 0, style: 'headline' },
          { text: 'are preserving their stories.', delay: 2.5, style: 'body' },
          { text: 'Join the movement.', delay: 5.5, style: 'headline gold' },
          { text: 'One voice at a time.', delay: 8, style: 'headline' },
        ],
        duration: 16, endCardDelay: 12,
      },
      {
        day: 'wednesday', pillar: 'demo', title: 'Memories Preserved',
        lines: [
          { text: 'X,XXX memories', delay: 0, style: 'stat' },
          { text: 'preserved and counting.', delay: 2.5, style: 'headline' },
          { text: 'Add yours.', delay: 5, style: 'headline gold' },
        ],
        duration: 12, endCardDelay: 9,
      },
      {
        day: 'thursday', pillar: 'engagement', title: 'Share Challenge',
        lines: [
          { text: 'Share your', delay: 0, style: 'body' },
          { text: '#HeirloomChallenge', delay: 2, style: 'headline gold' },
          { text: 'recording.', delay: 4, style: 'headline' },
          { text: 'Show the world\nwhat matters to you.', delay: 6.5, style: 'body' },
        ],
        duration: 14, endCardDelay: 10,
      },
      {
        day: 'friday', pillar: 'viral', title: 'Disappearing Languages',
        lines: [
          { text: 'The world is losing', delay: 0, style: 'headline' },
          { text: '2 languages', delay: 2.5, style: 'stat' },
          { text: 'every month.', delay: 4.5, style: 'headline' },
          { text: 'Voices are disappearing\neven faster.', delay: 7, style: 'headline gold' },
          { text: 'Preserve yours.', delay: 10.5, style: 'headline' },
        ],
        duration: 18, endCardDelay: 14,
      },
    ],
  },
  {
    theme: 'Future & Recap',
    posts: [
      {
        day: 'monday', pillar: 'demo', title: 'Coming: Memory Map',
        lines: [
          { text: 'Coming soon:', delay: 0, style: 'body' },
          { text: 'Memory Map', delay: 2, style: 'headline gold' },
          { text: 'See where your family\'s\nstories happened.', delay: 4.5, style: 'headline' },
          { text: 'Pin memories\nto locations.', delay: 8, style: 'body' },
          { text: 'Walk in their footsteps.', delay: 11, style: 'headline gold' },
        ],
        duration: 20, endCardDelay: 15,
      },
      {
        day: 'tuesday', pillar: 'emotional', title: '12 Weeks Thank You',
        lines: [
          { text: '12 weeks.', delay: 0, style: 'stat' },
          { text: 'XX,XXX memories preserved.', delay: 2.5, style: 'headline' },
          { text: 'Thank you.', delay: 5.5, style: 'headline gold' },
          { text: 'Every voice matters.\nEvery story counts.', delay: 8, style: 'body' },
        ],
        duration: 16, endCardDelay: 12,
      },
      {
        day: 'wednesday', pillar: 'demo', title: 'Coming: Memory Books',
        lines: [
          { text: 'Coming soon:', delay: 0, style: 'body' },
          { text: 'Printed Memory Books', delay: 2, style: 'headline gold' },
          { text: 'Your family\'s story', delay: 5, style: 'headline' },
          { text: 'in hardcover.', delay: 7, style: 'headline gold' },
          { text: 'Letters. Photos. Stories.\nAll in one beautiful book.', delay: 9.5, style: 'body' },
        ],
        duration: 20, endCardDelay: 15,
      },
      {
        day: 'thursday', pillar: 'engagement', title: 'Next Feature Poll',
        lines: [
          { text: 'What feature should\nwe build next?', delay: 0, style: 'headline' },
          { text: 'A) Video time capsules', delay: 3, style: 'body' },
          { text: 'B) AI story generator', delay: 5, style: 'body' },
          { text: 'C) Family tree builder', delay: 7, style: 'body' },
          { text: 'D) Memory quilts', delay: 9, style: 'body' },
          { text: 'Vote in comments \u2B07\uFE0F', delay: 12, style: 'headline gold' },
        ],
        duration: 20, endCardDelay: 16,
      },
      {
        day: 'friday', pillar: 'viral', title: 'Live Forever',
        lines: [
          { text: 'One voice.', delay: 0, style: 'headline' },
          { text: 'One letter.', delay: 2.5, style: 'headline' },
          { text: 'One photo.', delay: 5, style: 'headline' },
          { text: 'That\'s all it takes', delay: 8, style: 'body' },
          { text: 'to live forever.', delay: 10.5, style: 'headline gold' },
          { text: 'heirloom.blue', delay: 14, style: 'headline gold' },
        ],
        duration: 22, endCardDelay: 18,
      },
    ],
  },
];

/**
 * Generate default captions for posts that only have video lines defined.
 */
function generateDefaultCaptions(post, weekNum) {
  const mainText = post.lines
    .filter(l => l.style !== 'stat')
    .map(l => l.text.replace(/\n/g, ' '))
    .join(' ');
  const shortText = mainText.length > 200 ? mainText.substring(0, 200) + '...' : mainText;

  return {
    tiktok: `${shortText}\n\n${CTA_SHORT}\n\n${HASHTAGS_TIKTOK}`,
    instagram: `${mainText}\n\n${CTA_URL}\n\n${HASHTAGS_IG}`,
    facebook: `${mainText}\n\n${CTA_URL}`,
    twitter: `${shortText}\n\nheirloom.blue`,
    linkedin: `${mainText}\n\n${CTA_URL}`,
    youtube_title: `${post.title} | Heirloom`,
    youtube_description: `${shortText}\n\nStart free \u2192 https://heirloom.blue`,
    threads: `${shortText}\n\n${CTA_URL}`,
  };
}

// ---- Build all 60 posts ----
const allPosts = [];

WEEKS.forEach((week, wi) => {
  const weekNum = wi + 1;
  week.posts.forEach((post) => {
    const id = `w${weekNum}-${post.day.substring(0, 3)}`;
    const captions = post.captions || generateDefaultCaptions(post, weekNum);
    allPosts.push({
      id,
      week: weekNum,
      day: post.day,
      pillar: post.pillar,
      title: post.title,
      weekTheme: week.theme,
      video: {
        duration: post.duration,
        lines: post.lines,
        endCardDelay: post.endCardDelay,
      },
      captions,
      platforms: PLATFORMS,
    });
  });
});

// Write master file
const masterPath = path.join(CONTENT_DIR, 'all-posts.json');
fs.writeFileSync(masterPath, JSON.stringify(allPosts, null, 2));
console.log(`Created: ${masterPath} (${allPosts.length} posts)`);

// Write per-week files for bulk loading
for (let w = 1; w <= 12; w++) {
  const weekPosts = allPosts.filter(p => p.week === w);
  // Format for the /admin/social/bulk-load endpoint
  const bulkPayload = {
    week: w,
    startDate: `REPLACE_WITH_START_DATE`,  // e.g. "2026-04-14" for week 1
    posts: weekPosts.map(p => ({
      platforms: p.platforms,
      content: {
        title: p.title,
        captions: p.captions,
        video_key: `social-assets/${p.id}/${p.id}.mp4`,
      },
      pillar: p.pillar,
    })),
  };
  const weekPath = path.join(CONTENT_DIR, `week-${w}.json`);
  fs.writeFileSync(weekPath, JSON.stringify(bulkPayload, null, 2));
  console.log(`Created: ${weekPath} (${weekPosts.length} posts)`);
}

console.log(`\nDone! ${allPosts.length} posts generated across 12 weeks.`);
console.log('Before bulk-loading, replace REPLACE_WITH_START_DATE in each week-*.json with the actual Monday date.');
