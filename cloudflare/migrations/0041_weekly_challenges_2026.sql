-- Migration 0041: Full 52-week challenge calendar for 2026
-- Replaces the 4 stale relative-date seed rows from 0025 with
-- absolute-dated challenges for every week of 2026.
-- Weeks run Monday–Sunday, starting 2026-01-05.
-- Week 22 (2026-06-01) is the current live week.

DELETE FROM weekly_challenges;

INSERT INTO weekly_challenges (id, title, description, theme, hashtag, prompt, start_date, end_date, is_active) VALUES

-- JANUARY: Foundations
('wk-2026-01', 'Your First Memory', 'Begin the thread with the earliest moment you can recall — no matter how small.', 'origins', '#FirstMemory', 'What is your earliest memory? Close your eyes and return to it: where were you, who was there, what did it feel like in your body? Write it as if recounting a dream you don''t want to lose.', '2026-01-05', '2026-01-11', 0),

('wk-2026-02', 'The House You Grew Up In', 'Walk us through the rooms. Every family''s home holds a different world.', 'place', '#ChildhoodHome', 'Describe the house, apartment, or place where you spent most of your childhood. What did it smell like? Which room was the heart of it? What would you find if you opened the refrigerator right now?', '2026-01-12', '2026-01-18', 0),

('wk-2026-03', 'A Grandmother''s Story', 'The stories that get told only in certain kitchens, at certain hours.', 'ancestors', '#GrandmotherStories', 'Share a story your grandmother told — or a story about her that you carry. What did she know that she never quite put into words? What would you ask her now if you could?', '2026-01-19', '2026-01-25', 0),

('wk-2026-04', 'Your Parents at Your Age', 'They were young once, and stranger than you imagine.', 'family', '#ParentsAtMyAge', 'What do you know about what your parents were like at the age you are now? How different were their lives from yours? What do you share that you''ve never said out loud?', '2026-01-26', '2026-02-01', 0),

-- FEBRUARY: Love & Connection
('wk-2026-05', 'A Love Story', 'Every family begins somewhere. This is how yours started.', 'love', '#FamilyLoveStory', 'Tell the story of how two people in your family found each other — your parents, grandparents, or your own beginning. What do you know of how it started? What details have been passed down?', '2026-02-02', '2026-02-08', 0),

('wk-2026-06', 'A Sibling Story', 'The relationship you didn''t choose but can never fully leave.', 'siblings', '#SiblingMemory', 'Describe a memory that perfectly captures your relationship with a sibling — or with an only-child''s particular solitude. The fights, the alliances, the private language. What made your bond exactly what it was?', '2026-02-09', '2026-02-15', 0),

('wk-2026-07', 'The Person Who Changed Your Life', 'A teacher, a neighbor, a stranger on a train. Not family by blood but family by impact.', 'mentors', '#ChangedMyLife', 'Who is the person outside your immediate family who most shaped who you became? Describe them: how they spoke, what they saw in you, the moment things shifted. Where are they now?', '2026-02-16', '2026-02-22', 0),

('wk-2026-08', 'The Family You Chose', 'The friends who became something closer.', 'chosen-family', '#ChosenFamily', 'Write about a friendship that became as deep as family. How did it happen? What rituals and shorthand and silences did you build together? What would be missing from your life without this person?', '2026-02-23', '2026-03-01', 0),

-- MARCH: Roots
('wk-2026-09', 'Your Name and Its Story', 'Every name is a small inheritance.', 'identity', '#MyNameStory', 'Tell the story of your full name. Who chose it, and why? Were you almost named something else? Does it have a meaning in another language, a family lineage, a story you were told as a child? What does your name mean to you now?', '2026-03-02', '2026-03-08', 0),

('wk-2026-10', 'A Family Recipe', 'The dish that means home. The one you''d make for someone you loved on their worst day.', 'food', '#FamilyRecipe', 'Write down a recipe your family makes — not just the ingredients, but the story of it. Who taught it to you? What does it take to get it right? When is it made, and who gathers around it?', '2026-03-09', '2026-03-15', 0),

('wk-2026-11', 'Where They Came From', 'Before the house, before the neighborhood, before you — there was somewhere else.', 'origins', '#FamilyOrigins', 'Tell the origin story of your family''s home. What place did your ancestors come from? Why did they leave, or why did they stay? What do you know — and what has been lost?', '2026-03-16', '2026-03-22', 0),

('wk-2026-12', 'A Language Heard at Home', 'The words that didn''t quite translate, and what was lost in the gap.', 'language', '#LanguageOfHome', 'Did you grow up with more than one language — or with words and phrases that belonged only to your family? Write about the language of your home: the code-switching, the untranslatable words, the things that could only be said in one tongue.', '2026-03-23', '2026-03-29', 0),

('wk-2026-13', 'A Family Saying', 'The phrase that everyone still says, years later, without quite knowing why.', 'language', '#FamilySaying', 'What saying, expression, or piece of advice was repeated in your home so often it became part of you? Write down its exact words. Where did it come from? Do you still say it?', '2026-03-30', '2026-04-05', 0),

-- APRIL: Work & Craft
('wk-2026-14', 'What They Did for Work', 'The job that shaped the household, the schedule, the mood at the dinner table.', 'labor', '#FamilyWork', 'Describe the working life of a parent or grandparent. What did they do? What did it cost them, and what did it give them? Did they love it? Did they tell you not to follow them into it?', '2026-04-06', '2026-04-12', 0),

('wk-2026-15', 'Your First Job', 'Where the working self was born.', 'labor', '#FirstJobStory', 'Tell the story of your first job — the one that paid you, or the one that didn''t but mattered anyway. Who hired you? What did you learn that no one intended to teach you? What would you tell that version of yourself?', '2026-04-13', '2026-04-19', 0),

('wk-2026-16', 'A Skill Passed Down', 'Something that lives in your hands now because someone put it there.', 'craft', '#InheritedSkill', 'What skill, craft, or knowledge did you learn from someone in your family? Describe how you were taught: patiently or with frustration, in silence or with stories, hands over hands. Do you still practice it?', '2026-04-20', '2026-04-26', 0),

('wk-2026-17', 'The Thing They Made', 'A garden, a cabinet, a business, a quilt. Something that outlasted the making.', 'craft', '#TheyBuiltThis', 'Write about something someone in your family created — with their hands, their savings, their years. Describe the making of it, and what it means now that it exists. Does it still survive?', '2026-04-27', '2026-05-03', 0),

-- MAY: Passages
('wk-2026-18', 'A First Day', 'Every beginning is also a kind of loss. What did you leave behind?', 'milestones', '#FirstDayMemory', 'Describe a first day — the first day of school, the first day in a new country, the first day of a job, the first day without someone. What were you wearing? Who was with you? What did you not yet know?', '2026-05-04', '2026-05-10', 0),

('wk-2026-19', 'A Graduation', 'The ceremony marks a crossing. What was waiting on the other side?', 'milestones', '#FamilyGraduation', 'Tell the story of a graduation in your family — yours or someone else''s. What did it take to get there? Who came to watch? What was said afterward that you still remember?', '2026-05-11', '2026-05-17', 0),

('wk-2026-20', 'A Wedding Story', 'Two families becoming one. The seams always show, just a little.', 'milestones', '#FamilyWedding', 'Describe a wedding you attended or the wedding of your parents or grandparents as you know it. What went exactly right? What went wrong in a way that became part of the story? What do you remember most vividly?', '2026-05-18', '2026-05-24', 0),

('wk-2026-21', 'A Birth Story', 'The moment before you were outnumbered.', 'milestones', '#BirthStory', 'Tell the story of a birth in your family — yours, a sibling''s, a child''s. Who was there? What happened that wasn''t in the plan? What was the first thing someone said when the child arrived?', '2026-05-25', '2026-05-31', 0),

-- JUNE: Summer
('wk-2026-22', 'The Summer You Remember Most', 'Long days, no school, the world belonging to you.', 'seasons', '#SummerMemory', 'Which summer stands out from all the others? How old were you? Who were you spending your days with? Describe a single afternoon from that summer in as much detail as you can recover.', '2026-06-01', '2026-06-07', 1),

('wk-2026-23', 'A Road Trip', 'The car, the map, the hours of nothing — and what happened in them.', 'travel', '#FamilyRoadTrip', 'Tell the story of a road trip your family took. Where were you going, and why? What happened along the way that wasn''t planned? What do you remember most — the arrival, or the hours in between?', '2026-06-08', '2026-06-14', 0),

('wk-2026-24', 'A Childhood Friend', 'The person you were most yourself with, before the world complicated things.', 'friendship', '#ChildhoodFriend', 'Describe your closest childhood friend. What did you do together? What did the friendship give you that home couldn''t? What happened to it? Do you know where they are now?', '2026-06-15', '2026-06-21', 0),

('wk-2026-25', 'A Childhood Game', 'The game you played for hours without anyone telling you to.', 'play', '#ChildhoodGame', 'What game — invented or borrowed, inside or out — consumed your childhood attention? Describe its rules, its rituals, the cast of characters who played it with you. When did you stop playing, and why?', '2026-06-22', '2026-06-28', 0),

('wk-2026-26', 'A Family Vacation', 'The trip everyone packed for. What you remember is not what they remember.', 'travel', '#FamilyVacation', 'Tell the story of a family vacation. Who came, who drove, where you stayed. What was the trip supposed to be, and what did it become? What small detail — a smell, a phrase, a wrong turn — stays with you?', '2026-06-29', '2026-07-05', 0),

-- JULY: Objects & Music
('wk-2026-27', 'A Family Heirloom', 'An object with more story than substance. Its weight is mostly memory.', 'objects', '#FamilyHeirloom', 'Describe an object that has been passed down in your family — or that should have been. What is it made of? Who owned it first? How did it travel through generations to reach you, or how was it lost along the way?', '2026-07-06', '2026-07-12', 0),

('wk-2026-28', 'The Books on the Shelf', 'What a family reads tells you what a family dreams.', 'objects', '#FamilyBookshelf', 'What books were in your home growing up? Describe the shelf, the stack, the single dog-eared paperback. Was reading encouraged or discouraged? What book was there that you weren''t supposed to touch?', '2026-07-13', '2026-07-19', 0),

('wk-2026-29', 'The Music in the House', 'The songs that played. The ones you didn''t choose but now carry everywhere.', 'music', '#FamilyMusic', 'What music do you associate with your family? The radio station that was always on, the album someone played in grief, the song that meant a celebration. Describe the music of your household and what it gave you.', '2026-07-20', '2026-07-26', 0),

('wk-2026-30', 'A Vehicle You Remember', 'Cars carry more than passengers.', 'objects', '#FamilyCar', 'Describe a vehicle from your childhood — the family car, a grandparent''s truck, a bicycle, a motorbike. What did it look like, smell like, sound like? What happened inside it, on the road, in the driveway? What did it mean to whoever drove it?', '2026-07-27', '2026-08-02', 0),

('wk-2026-31', 'A Photograph You''d Save', 'If the house were on fire and there was one photograph.', 'memory', '#ThePhotoI''dSave', 'Describe the photograph you would save from your family''s collection if you could only keep one. What does it show? When was it taken? What is not visible in the frame that you know was there? Why this one?', '2026-08-03', '2026-08-09', 0),

-- AUGUST: Land & Place
('wk-2026-32', 'A Garden or Field', 'The patch of earth that someone tended. Land as love language.', 'land', '#FamilyGarden', 'Describe land that mattered to your family — a garden, a farm, a backyard, a vacant lot turned into something. Who worked it? What grew there? Has it changed, or disappeared entirely?', '2026-08-10', '2026-08-16', 0),

('wk-2026-33', 'A Landmark in Your Town', 'The building, the corner, the bridge. The things that make a place legible.', 'place', '#HomeTownLandmark', 'Describe a landmark from the town or neighborhood you grew up in. What was it? Why did it matter to your family, your school, your daily route? Is it still there?', '2026-08-17', '2026-08-23', 0),

('wk-2026-34', 'The View from a Window', 'The outside world, framed. What you saw from inside your life.', 'place', '#WindowView', 'Describe what you saw from the window you looked out of most as a child — the bedroom window, the kitchen window, the bus window. What seasons did you watch through it? What did you watch for?', '2026-08-24', '2026-08-30', 0),

('wk-2026-35', 'The House at the End', 'Grandparents'', or an aunt''s, or the place everyone went at holidays. The second home.', 'place', '#SecondHome', 'Describe the house that wasn''t home but felt like one — a grandparent''s place, a relative''s, the house at the end of the road everyone went to. Walk us through its rooms. What happened there that couldn''t happen anywhere else?', '2026-08-31', '2026-09-06', 0),

-- SEPTEMBER: Difficulty & Truth
('wk-2026-36', 'A Loss That Changed You', 'Grief is part of every family thread.', 'grief', '#FamilyLoss', 'Write about a loss in your family — the death of someone loved, the end of something important, a relationship that dissolved. What changed after? What do you wish you''d said? What do you still carry?', '2026-09-07', '2026-09-13', 0),

('wk-2026-37', 'A Difficult Year', 'The year the family bent. What held it together.', 'resilience', '#HardYear', 'Tell the story of a year that tested your family. What happened? How did different people in the family carry it differently? What got you through, and what did you lose along the way that you never fully recovered?', '2026-09-14', '2026-09-20', 0),

('wk-2026-38', 'The Argument That Became a Story', 'The fight you still laugh about — or the one you don''t.', 'family', '#FamilyArgument', 'Describe a family argument that became part of the family''s mythology. What was it about? Who was involved? How did it end? Why does it get retold?', '2026-09-21', '2026-09-27', 0),

('wk-2026-39', 'A Secret That Was Finally Told', 'Every family has things that were kept. What happened when the keeping stopped?', 'truth', '#FamilySecret', 'Write about a secret in your family — something kept for years that was eventually revealed, or something you still carry. What made it hard to say? What changed when it was finally spoken, or what it has cost to keep it?', '2026-09-28', '2026-10-04', 0),

-- OCTOBER: Ancestors
('wk-2026-40', 'An Ancestor You Never Met', 'The shape of someone you know only through stories and photographs.', 'ancestors', '#AncestorStory', 'Write about an ancestor you never met. What do you know of their life — their name, their face, their work, their fate? What has been passed down to you in their image? What do you wish you could ask them?', '2026-10-05', '2026-10-11', 0),

('wk-2026-41', 'A Migration Story', 'Someone left a place. Nothing was ever quite the same.', 'migration', '#FamilyMigration', 'Tell the story of someone in your family who moved — across a border, across a country, from a village to a city. Why did they go? What did they leave behind? What did they find? How has that movement shaped who you are?', '2026-10-12', '2026-10-18', 0),

('wk-2026-42', 'A Time of Crisis in Your Family''s History', 'A war, a famine, an illness, a collapse. How your bloodline survived.', 'history', '#FamilyHistory', 'Write about a historical event — a war, a pandemic, an economic collapse, a political upheaval — that touched your family directly. What happened? Who survived? What was lost? What stories came out of it?', '2026-10-19', '2026-10-25', 0),

('wk-2026-43', 'The Letter Never Sent', 'What they wanted to say but couldn''t. What you''d write now.', 'letters', '#LetterNeverSent', 'Write a letter — as yourself, or imagining someone in your family — to a person who never received it. What needed to be said? What was the silence protecting? What would change if it had been sent?', '2026-10-26', '2026-11-01', 0),

-- NOVEMBER: Gratitude
('wk-2026-44', 'A Moment of Pride', 'The instant you saw someone in your family fully.', 'gratitude', '#FamilyPride', 'Describe a moment when you felt unmistakable pride in someone in your family. What were they doing? What did they not know you were witnessing? Why does this moment stay with you?', '2026-11-02', '2026-11-08', 0),

('wk-2026-45', 'What They Worked For', 'The thing they sacrificed for. Whether they named it or not.', 'gratitude', '#WhatTheyWorkedFor', 'Write about the thing your parents or grandparents were working toward their whole lives — named or unnamed, achieved or only approached. What did it cost them? Did they reach it? Do you carry it forward?', '2026-11-09', '2026-11-15', 0),

('wk-2026-46', 'A Voice You Miss', 'The sound of someone who is gone.', 'grief', '#VoiceIMiss', 'Write about the voice of someone you''ve lost. Not what they said, but how they sounded — the rhythm of their speech, the words they favored, the way they said your name. When do you still hear it?', '2026-11-16', '2026-11-22', 0),

('wk-2026-47', 'A Holiday Gathering', 'The table set. Everyone arriving. The particular chaos of family.', 'traditions', '#HolidayGathering', 'Describe a holiday gathering at its peak — who came, who always sat where, what was cooked, what argument was narrowly avoided, what ritual held it together. Who is missing from that table now?', '2026-11-23', '2026-11-29', 0),

-- DECEMBER: Legacy
('wk-2026-48', 'What They Left Behind', 'An inheritance beyond objects. The things you didn''t ask for but received anyway.', 'legacy', '#WhatTheyLeft', 'Write about what you inherited from your family beyond the material — the values, the fears, the habits, the ways of moving through the world. What did you choose to keep, and what are you still deciding about?', '2026-11-30', '2026-12-06', 0),

('wk-2026-49', 'A Winter Memory', 'Cold and dark and still beautiful. The inside life of winter.', 'seasons', '#WinterMemory', 'Describe a winter memory from your childhood — the specific cold, the specific dark, the specific warmth found inside it. A snow day, a holiday, an illness, a storm. What is the interior life of winter in your family?', '2026-12-07', '2026-12-13', 0),

('wk-2026-50', 'The Day Everything Changed', 'Before and after. The turning point no one saw coming.', 'legacy', '#DayEverythingChanged', 'Tell the story of the day your family''s life divided into before and after. It may not have seemed momentous at the time. Describe what the day looked like, and how you know now that it was the hinge.', '2026-12-14', '2026-12-20', 0),

('wk-2026-51', 'What You Want Your Children to Know', 'Not advice. The truth of your experience.', 'legacy', '#ForMyChildren', 'Write the thing you most want the people who come after you to know — not a lesson or a warning, but a truth from your life. Write it as if you are speaking directly to them across time. Be specific. Be honest.', '2026-12-21', '2026-12-27', 0),

('wk-2026-52', 'What You Want Remembered', 'The end of the year. The beginning of the thread.', 'legacy', '#WhatToRemember', 'Write your answer to the oldest question a family can ask: what do you want the people who come after you to remember about this life? Not a summary. One true thing. The thing that matters most.', '2026-12-28', '2027-01-03', 0);
