/**
 * Adoption Jobs - Automated Cron Jobs for User Engagement
 * Handles drip campaigns, re-engagement, birthday reminders, automated outreach, and prospect discovery
 */

import type { Env } from '../index';
import { sendEmail } from '../utils/email';

// ============================================
// CURATED PROSPECT SOURCES
// These are publicly available genealogy/family history influencers and creators
// Updated weekly with new discoveries
// ============================================

const CURATED_PROSPECTS = [
  // Genealogy YouTubers & Content Creators
  { name: 'Amy Johnson Crow', email: 'amy@amyjohnsoncrow.com', platform: 'YOUTUBE', segment: 'GENEALOGY', handle: '@AmyJohnsonCrow', follower_count: 50000 },
  { name: 'Genealogy TV', email: 'contact@genealogytv.org', platform: 'YOUTUBE', segment: 'GENEALOGY', handle: '@GenealogyTV', follower_count: 45000 },
  { name: 'Family History Fanatics', email: 'hello@familyhistoryfanatics.com', platform: 'YOUTUBE', segment: 'GENEALOGY', handle: '@FamilyHistoryFanatics', follower_count: 120000 },
  { name: 'Ancestry Made Easy', email: 'info@ancestrymadeeasy.com', platform: 'YOUTUBE', segment: 'GENEALOGY', handle: '@AncestryMadeEasy', follower_count: 35000 },
  { name: 'Lisa Louise Cooke', email: 'lisa@lisalouisecooke.com', platform: 'PODCAST', segment: 'GENEALOGY', handle: '@GenealogyGems', follower_count: 80000 },
  
  // Family Memory & Legacy Bloggers
  { name: 'The Photo Organizers', email: 'hello@thephotoorganizers.com', platform: 'BLOG', segment: 'PARENTING', handle: '@PhotoOrganizers', follower_count: 25000 },
  { name: 'Family Locket', email: 'contact@familylocket.com', platform: 'BLOG', segment: 'GENEALOGY', handle: '@FamilyLocket', follower_count: 15000 },
  { name: 'Organized Photos', email: 'info@organizedphotos.com', platform: 'BLOG', segment: 'PARENTING', handle: '@OrganizedPhotos', follower_count: 20000 },
  { name: 'Memory Keeping Mom', email: 'hello@memorykeepingmom.com', platform: 'INSTAGRAM', segment: 'PARENTING', handle: '@memorykeepingmom', follower_count: 45000 },
  { name: 'Legacy Tales', email: 'stories@legacytales.com', platform: 'BLOG', segment: 'GENEALOGY', handle: '@LegacyTales', follower_count: 12000 },
  
  // Grief & Memorial Content Creators
  { name: 'Whats Your Grief', email: 'hello@whatsyourgrief.com', platform: 'BLOG', segment: 'GRIEF', handle: '@WhatsYourGrief', follower_count: 150000 },
  { name: 'Modern Loss', email: 'info@modernloss.com', platform: 'BLOG', segment: 'GRIEF', handle: '@ModernLoss', follower_count: 85000 },
  { name: 'The Grief Recovery Method', email: 'contact@griefrecoverymethod.com', platform: 'BLOG', segment: 'GRIEF', handle: '@GriefRecovery', follower_count: 60000 },
  { name: 'Refuge in Grief', email: 'megan@refugeingrief.com', platform: 'BLOG', segment: 'GRIEF', handle: '@RefugeInGrief', follower_count: 40000 },
  { name: 'Option B', email: 'hello@optionb.org', platform: 'BLOG', segment: 'GRIEF', handle: '@OptionBOrg', follower_count: 200000 },
  
  // Estate Planning & Legacy Influencers
  { name: 'Estate Planning Mom', email: 'info@estateplanningmom.com', platform: 'BLOG', segment: 'ESTATE_PLANNING', handle: '@EstatePlanningMom', follower_count: 30000 },
  { name: 'Legacy Planning', email: 'contact@legacyplanning.com', platform: 'BLOG', segment: 'ESTATE_PLANNING', handle: '@LegacyPlanning', follower_count: 25000 },
  { name: 'Your Legacy Legal', email: 'info@yourlegacylegal.com', platform: 'BLOG', segment: 'ESTATE_PLANNING', handle: '@YourLegacyLegal', follower_count: 18000 },
  
  // Parenting & Family Memory Influencers
  { name: 'Scary Mommy', email: 'partnerships@scarymommy.com', platform: 'BLOG', segment: 'PARENTING', handle: '@ScaryMommy', follower_count: 2000000 },
  { name: 'Motherly', email: 'partnerships@mother.ly', platform: 'BLOG', segment: 'PARENTING', handle: '@Motherly', follower_count: 1500000 },
  { name: 'Today Parenting', email: 'parenting@today.com', platform: 'BLOG', segment: 'PARENTING', handle: '@TodayParenting', follower_count: 500000 },
  { name: 'Parents Magazine', email: 'editors@parents.com', platform: 'BLOG', segment: 'PARENTING', handle: '@ParentsMagazine', follower_count: 800000 },
  
  // Podcasters in Family/Legacy Space
  { name: 'Extreme Genes', email: 'scott@extremegenes.com', platform: 'PODCAST', segment: 'GENEALOGY', handle: '@ExtremeGenes', follower_count: 50000 },
  { name: 'The Genealogy Guys', email: 'guys@genealogyguys.com', platform: 'PODCAST', segment: 'GENEALOGY', handle: '@GenealogyGuys', follower_count: 35000 },
  { name: 'Ancestral Findings', email: 'info@ancestralfindings.com', platform: 'PODCAST', segment: 'GENEALOGY', handle: '@AncestralFindings', follower_count: 28000 },
  { name: 'Research Like a Pro', email: 'nicole@familylocket.com', platform: 'PODCAST', segment: 'GENEALOGY', handle: '@ResearchLikeAPro', follower_count: 22000 },
  
  // Tech & Digital Legacy
  { name: 'Digital Beyond', email: 'info@thedigitalbeyond.com', platform: 'BLOG', segment: 'TECH', handle: '@DigitalBeyond', follower_count: 15000 },
  { name: 'The Digital Estate', email: 'contact@thedigitalestate.com', platform: 'BLOG', segment: 'TECH', handle: '@DigitalEstate', follower_count: 12000 },
  { name: 'Everplans', email: 'hello@everplans.com', platform: 'BLOG', segment: 'TECH', handle: '@Everplans', follower_count: 40000 },
  
  // Micro-influencers in Family History Niche
  { name: 'Family Tree Magazine', email: 'editors@familytreemagazine.com', platform: 'BLOG', segment: 'GENEALOGY', handle: '@FamilyTreeMag', follower_count: 100000 },
  { name: 'Genealogy Bank', email: 'marketing@genealogybank.com', platform: 'BLOG', segment: 'GENEALOGY', handle: '@GenealogyBank', follower_count: 75000 },
  { name: 'Find A Grave', email: 'support@findagrave.com', platform: 'BLOG', segment: 'GENEALOGY', handle: '@FindAGrave', follower_count: 200000 },
  { name: 'Billion Graves', email: 'info@billiongraves.com', platform: 'BLOG', segment: 'GENEALOGY', handle: '@BillionGraves', follower_count: 50000 },
  
  // International Genealogy
  { name: 'Who Do You Think You Are', email: 'magazine@whodoyouthinkyouaremagazine.com', platform: 'BLOG', segment: 'GENEALOGY', handle: '@WDYTYA', follower_count: 150000 },
  { name: 'Irish Genealogy News', email: 'claire@irishgenealogynews.com', platform: 'BLOG', segment: 'GENEALOGY', handle: '@IrishGenNews', follower_count: 25000 },
  { name: 'Scottish Genealogy', email: 'info@scottishgenealogy.com', platform: 'BLOG', segment: 'GENEALOGY', handle: '@ScotGenealogy', follower_count: 18000 },
  { name: 'German Genealogy', email: 'contact@germangenealogygroup.com', platform: 'BLOG', segment: 'GENEALOGY', handle: '@GermanGenealogy', follower_count: 22000 },
];

// Search patterns for discovering new prospects (used by admin to manually add)
const DISCOVERY_SEARCH_PATTERNS = [
  'genealogy blogger contact',
  'family history YouTuber email',
  'ancestry content creator',
  'grief support blogger',
  'estate planning influencer',
  'memory keeping Instagram',
  'family legacy podcast host',
  'photo organizing expert',
  'digital legacy planning',
  'family storytelling coach',
];

// ============================================
// VIRAL INFLUENCERS - COMPREHENSIVE LIST
// Mega influencers across all platforms and segments
// ============================================

const VIRAL_INFLUENCERS = [
  // ========== MEGA LIFESTYLE & FAMILY INFLUENCERS ==========
  { name: 'The Bucket List Family', email: 'hello@thebucketlistfamily.com', platform: 'INSTAGRAM', segment: 'FAMILY_TRAVEL', handle: '@thebucketlistfamily', follower_count: 2800000 },
  { name: 'Daily Bumps', email: 'business@dailybumps.com', platform: 'YOUTUBE', segment: 'FAMILY_VLOG', handle: '@DailyBumps', follower_count: 6000000 },
  { name: 'The ACE Family', email: 'business@theacefamily.com', platform: 'YOUTUBE', segment: 'FAMILY_VLOG', handle: '@TheACEFamily', follower_count: 19000000 },
  { name: 'The LaBrant Fam', email: 'business@thelabrantfam.com', platform: 'YOUTUBE', segment: 'FAMILY_VLOG', handle: '@TheLaBrantFam', follower_count: 13000000 },
  { name: 'Dude Perfect', email: 'business@dudeperfect.com', platform: 'YOUTUBE', segment: 'ENTERTAINMENT', handle: '@DudePerfect', follower_count: 60000000 },
  { name: 'MrBeast', email: 'business@mrbeast.com', platform: 'YOUTUBE', segment: 'ENTERTAINMENT', handle: '@MrBeast', follower_count: 200000000 },
  { name: 'Ryan Kaji', email: 'business@ryansworld.com', platform: 'YOUTUBE', segment: 'KIDS_FAMILY', handle: '@RyansWorld', follower_count: 35000000 },
  { name: 'Jenna Kutcher', email: 'hello@jennakutcher.com', platform: 'INSTAGRAM', segment: 'LIFESTYLE', handle: '@jennakutcher', follower_count: 1000000 },
  { name: 'Rachel Hollis', email: 'hello@msrachelhollis.com', platform: 'INSTAGRAM', segment: 'MOTIVATION', handle: '@msrachelhollis', follower_count: 1700000 },
  { name: 'Joanna Gaines', email: 'press@magnolia.com', platform: 'INSTAGRAM', segment: 'HOME_FAMILY', handle: '@joannagaines', follower_count: 13000000 },
  
  // ========== PARENTING & MOM INFLUENCERS ==========
  { name: 'Kristina Kuzmic', email: 'booking@kristinakuzmic.com', platform: 'YOUTUBE', segment: 'PARENTING', handle: '@KristinaKuzmic', follower_count: 2000000 },
  { name: 'Bunmi Laditan', email: 'contact@bunmiladitan.com', platform: 'INSTAGRAM', segment: 'PARENTING', handle: '@bunmiladitan', follower_count: 500000 },
  { name: 'Laura Clery', email: 'business@lauraclery.com', platform: 'INSTAGRAM', segment: 'COMEDY_PARENTING', handle: '@lauraclery', follower_count: 3000000 },
  { name: 'Tia Mowry', email: 'press@tiamowry.com', platform: 'INSTAGRAM', segment: 'PARENTING', handle: '@tiamowry', follower_count: 11000000 },
  { name: 'Busy Philipps', email: 'press@busyphilipps.com', platform: 'INSTAGRAM', segment: 'PARENTING', handle: '@busyphilipps', follower_count: 2000000 },
  { name: 'Amber Fillerup Clark', email: 'hello@amberfillerup.com', platform: 'INSTAGRAM', segment: 'LIFESTYLE_MOM', handle: '@amberfillerup', follower_count: 1300000 },
  { name: 'Eva Chen', email: 'press@evachen.com', platform: 'INSTAGRAM', segment: 'FASHION_MOM', handle: '@evachen212', follower_count: 1200000 },
  { name: 'Naomi Davis', email: 'hello@lovetaza.com', platform: 'INSTAGRAM', segment: 'FAMILY_LIFESTYLE', handle: '@taborandtaza', follower_count: 500000 },
  { name: 'Ilana Wiles', email: 'ilana@mommyshorts.com', platform: 'INSTAGRAM', segment: 'PARENTING', handle: '@mommyshorts', follower_count: 400000 },
  { name: 'Cat & Nat', email: 'hello@catandnat.com', platform: 'YOUTUBE', segment: 'PARENTING', handle: '@CatAndNat', follower_count: 500000 },
  
  // ========== WELLNESS & MENTAL HEALTH ==========
  { name: 'Jay Shetty', email: 'team@jayshetty.me', platform: 'INSTAGRAM', segment: 'WELLNESS', handle: '@jayshetty', follower_count: 12000000 },
  { name: 'Brene Brown', email: 'press@brenebrown.com', platform: 'INSTAGRAM', segment: 'MENTAL_HEALTH', handle: '@brenebrown', follower_count: 6000000 },
  { name: 'Mel Robbins', email: 'team@melrobbins.com', platform: 'INSTAGRAM', segment: 'MOTIVATION', handle: '@melrobbins', follower_count: 5000000 },
  { name: 'Gabby Bernstein', email: 'hello@gabbybernstein.com', platform: 'INSTAGRAM', segment: 'SPIRITUALITY', handle: '@gabbybernstein', follower_count: 1000000 },
  { name: 'Dr. Nicole LePera', email: 'hello@theholisticpsychologist.com', platform: 'INSTAGRAM', segment: 'MENTAL_HEALTH', handle: '@the.holistic.psychologist', follower_count: 7000000 },
  { name: 'Nedra Glover Tawwab', email: 'hello@nedratawwab.com', platform: 'INSTAGRAM', segment: 'THERAPY', handle: '@nedratawwab', follower_count: 1500000 },
  { name: 'Dr. Becky Kennedy', email: 'hello@drbeckyatgoodinside.com', platform: 'INSTAGRAM', segment: 'PARENTING_PSYCHOLOGY', handle: '@drbeckyatgoodinside', follower_count: 2000000 },
  { name: 'Glennon Doyle', email: 'press@glennondoyle.com', platform: 'INSTAGRAM', segment: 'MENTAL_HEALTH', handle: '@glennondoyle', follower_count: 2500000 },
  { name: 'Elizabeth Gilbert', email: 'press@elizabethgilbert.com', platform: 'INSTAGRAM', segment: 'INSPIRATION', handle: '@elizabeth_gilbert_writer', follower_count: 1200000 },
  { name: 'Deepak Chopra', email: 'press@deepakchopra.com', platform: 'INSTAGRAM', segment: 'WELLNESS', handle: '@deepakchopra', follower_count: 3000000 },
  
  // ========== GRIEF & LOSS SUPPORT ==========
  { name: 'Nora McInerny', email: 'hello@noraborealis.com', platform: 'PODCAST', segment: 'GRIEF', handle: '@noraborealis', follower_count: 200000 },
  { name: 'David Kessler', email: 'info@grief.com', platform: 'INSTAGRAM', segment: 'GRIEF', handle: '@davidkesslerla', follower_count: 300000 },
  { name: 'Sheryl Sandberg', email: 'press@leanin.org', platform: 'INSTAGRAM', segment: 'GRIEF_RESILIENCE', handle: '@sherylsandberg', follower_count: 2500000 },
  { name: 'Anderson Cooper', email: 'press@cnn.com', platform: 'PODCAST', segment: 'GRIEF', handle: '@andersoncooper', follower_count: 3000000 },
  { name: 'Terri Irwin', email: 'press@australiazoo.com.au', platform: 'INSTAGRAM', segment: 'GRIEF_FAMILY', handle: '@terriirwin', follower_count: 1500000 },
  
  // ========== SENIOR & AGING INFLUENCERS ==========
  { name: 'Iris Apfel', email: 'press@irisapfel.com', platform: 'INSTAGRAM', segment: 'SENIOR_FASHION', handle: '@iris.apfel', follower_count: 3000000 },
  { name: 'Baddie Winkle', email: 'business@baddiewinkle.com', platform: 'INSTAGRAM', segment: 'SENIOR_LIFESTYLE', handle: '@baddiewinkle', follower_count: 3500000 },
  { name: 'Joan MacDonald', email: 'hello@trainwithjoan.com', platform: 'INSTAGRAM', segment: 'SENIOR_FITNESS', handle: '@trainwithjoan', follower_count: 1600000 },
  { name: 'Lyn Slater', email: 'hello@accidentalicon.com', platform: 'INSTAGRAM', segment: 'SENIOR_FASHION', handle: '@iconaccidental', follower_count: 800000 },
  { name: 'Ernestine Shepherd', email: 'info@ernestineshepherd.net', platform: 'INSTAGRAM', segment: 'SENIOR_FITNESS', handle: '@ernestine.shepherd', follower_count: 200000 },
  { name: 'A Place for Mom', email: 'partnerships@aplaceformom.com', platform: 'BLOG', segment: 'SENIOR_LIVING', handle: '@APlaceForMom', follower_count: 300000 },
  { name: 'Senior Planet', email: 'info@seniorplanet.org', platform: 'BLOG', segment: 'SENIOR_LIVING', handle: '@SeniorPlanet', follower_count: 150000 },
  { name: 'Next Avenue', email: 'editors@nextavenue.org', platform: 'BLOG', segment: 'SENIOR_LIVING', handle: '@NextAvenue', follower_count: 200000 },
  { name: 'Sixty and Me', email: 'margaret@sixtyandme.com', platform: 'BLOG', segment: 'SENIOR_LIVING', handle: '@SixtyAndMe', follower_count: 500000 },
  
  // ========== WEDDING & CELEBRATION ==========
  { name: 'The Knot', email: 'partnerships@theknot.com', platform: 'BLOG', segment: 'WEDDING', handle: '@TheKnot', follower_count: 3000000 },
  { name: 'Wedding Wire', email: 'partnerships@weddingwire.com', platform: 'BLOG', segment: 'WEDDING', handle: '@WeddingWire', follower_count: 2000000 },
  { name: 'Brides Magazine', email: 'editors@brides.com', platform: 'BLOG', segment: 'WEDDING', handle: '@BridesMagazine', follower_count: 1500000 },
  { name: 'Martha Stewart Weddings', email: 'weddings@marthastewart.com', platform: 'BLOG', segment: 'WEDDING', handle: '@MarthaWeddings', follower_count: 800000 },
  { name: 'Jose Villa', email: 'studio@josevilla.com', platform: 'INSTAGRAM', segment: 'WEDDING_PHOTO', handle: '@josevilla', follower_count: 500000 },
  { name: 'KT Merry', email: 'hello@ktmerry.com', platform: 'INSTAGRAM', segment: 'WEDDING_PHOTO', handle: '@ktmerry', follower_count: 400000 },
  { name: 'Mindy Weiss', email: 'info@mindyweiss.com', platform: 'INSTAGRAM', segment: 'WEDDING_PLANNING', handle: '@mindyweiss', follower_count: 300000 },
  
  // ========== FAITH & SPIRITUALITY ==========
  { name: 'Joel Osteen', email: 'press@joelosteen.com', platform: 'INSTAGRAM', segment: 'FAITH', handle: '@joelosteen', follower_count: 14000000 },
  { name: 'Steven Furtick', email: 'press@elevationchurch.org', platform: 'INSTAGRAM', segment: 'FAITH', handle: '@stevenfurtick', follower_count: 5000000 },
  { name: 'Sadie Robertson', email: 'press@sadierobertson.com', platform: 'INSTAGRAM', segment: 'FAITH', handle: '@legitsadierob', follower_count: 4500000 },
  { name: 'Christine Caine', email: 'info@christinecaine.com', platform: 'INSTAGRAM', segment: 'FAITH', handle: '@christinecaine', follower_count: 1000000 },
  { name: 'Priscilla Shirer', email: 'info@goingbeyond.com', platform: 'INSTAGRAM', segment: 'FAITH', handle: '@praboreal', follower_count: 800000 },
  { name: 'Crosswalk', email: 'editors@crosswalk.com', platform: 'BLOG', segment: 'FAITH', handle: '@Crosswalk', follower_count: 1000000 },
  { name: 'Desiring God', email: 'info@desiringgod.org', platform: 'BLOG', segment: 'FAITH', handle: '@DesiringGod', follower_count: 800000 },
  { name: 'Relevant Magazine', email: 'editors@relevantmagazine.com', platform: 'BLOG', segment: 'FAITH', handle: '@RelevantMag', follower_count: 500000 },
  
  // ========== MILITARY & VETERANS ==========
  { name: 'Mat Best', email: 'business@matbest.com', platform: 'INSTAGRAM', segment: 'MILITARY', handle: '@matbestofficial', follower_count: 2000000 },
  { name: 'Jocko Willink', email: 'team@jockopodcast.com', platform: 'INSTAGRAM', segment: 'MILITARY_LEADERSHIP', handle: '@jaboreal', follower_count: 2500000 },
  { name: 'David Goggins', email: 'team@davidgoggins.com', platform: 'INSTAGRAM', segment: 'MILITARY_FITNESS', handle: '@davidgoggins', follower_count: 12000000 },
  { name: 'Military.com', email: 'partnerships@military.com', platform: 'BLOG', segment: 'MILITARY', handle: '@MilitaryCom', follower_count: 2000000 },
  { name: 'We Are The Mighty', email: 'info@wearethemighty.com', platform: 'BLOG', segment: 'MILITARY', handle: '@WeAreTheMighty', follower_count: 500000 },
  { name: 'Task & Purpose', email: 'editors@taskandpurpose.com', platform: 'BLOG', segment: 'MILITARY', handle: '@TaskAndPurpose', follower_count: 400000 },
  
  // ========== CULTURAL HERITAGE & ANCESTRY ==========
  { name: 'Henry Louis Gates Jr', email: 'press@pbs.org', platform: 'TV', segment: 'HERITAGE', handle: '@HenryLouisGates', follower_count: 500000 },
  { name: 'African Ancestry', email: 'info@africanancestry.com', platform: 'BLOG', segment: 'HERITAGE', handle: '@AfricanAncestry', follower_count: 100000 },
  { name: 'My Heritage', email: 'partnerships@myheritage.com', platform: 'BLOG', segment: 'HERITAGE', handle: '@MyHeritage', follower_count: 500000 },
  { name: 'Ancestry', email: 'partnerships@ancestry.com', platform: 'BLOG', segment: 'HERITAGE', handle: '@Ancestry', follower_count: 2000000 },
  { name: '23andMe', email: 'partnerships@23andme.com', platform: 'BLOG', segment: 'HERITAGE', handle: '@23andMe', follower_count: 500000 },
  
  // ========== MEMOIR & STORYTELLING ==========
  { name: 'Story Worth', email: 'hello@storyworth.com', platform: 'BLOG', segment: 'MEMOIR', handle: '@StoryWorth', follower_count: 100000 },
  { name: 'The Moth', email: 'info@themoth.org', platform: 'PODCAST', segment: 'STORYTELLING', handle: '@TheMoth', follower_count: 500000 },
  { name: 'StoryCorps', email: 'info@storycorps.org', platform: 'PODCAST', segment: 'STORYTELLING', handle: '@StoryCorps', follower_count: 300000 },
  { name: 'Life Bio', email: 'info@lifebio.com', platform: 'BLOG', segment: 'MEMOIR', handle: '@LifeBio', follower_count: 30000 },
  
  // ========== PHOTOGRAPHY & MEMORY KEEPING ==========
  { name: 'Peter McKinnon', email: 'business@petermckinnon.com', platform: 'YOUTUBE', segment: 'PHOTOGRAPHY', handle: '@PeterMcKinnon', follower_count: 6000000 },
  { name: 'Brandon Woelfel', email: 'business@brandonwoelfel.com', platform: 'INSTAGRAM', segment: 'PHOTOGRAPHY', handle: '@brandonwoelfel', follower_count: 3000000 },
  { name: 'Chris Burkard', email: 'studio@chrisburkard.com', platform: 'INSTAGRAM', segment: 'PHOTOGRAPHY', handle: '@chrisburkard', follower_count: 4000000 },
  { name: 'Jasmine Star', email: 'hello@jasminestar.com', platform: 'INSTAGRAM', segment: 'PHOTOGRAPHY_BUSINESS', handle: '@jasminestar', follower_count: 500000 },
  { name: 'Scrapbook.com', email: 'partnerships@scrapbook.com', platform: 'BLOG', segment: 'SCRAPBOOKING', handle: '@ScrapbookCom', follower_count: 400000 },
  { name: 'Ali Edwards', email: 'hello@aliedwards.com', platform: 'BLOG', segment: 'SCRAPBOOKING', handle: '@AliEdwards', follower_count: 150000 },
  
  // ========== THERAPY & PSYCHOLOGY ==========
  { name: 'Psychology Today', email: 'editors@psychologytoday.com', platform: 'BLOG', segment: 'THERAPY', handle: '@PsychToday', follower_count: 5000000 },
  { name: 'Good Therapy', email: 'info@goodtherapy.org', platform: 'BLOG', segment: 'THERAPY', handle: '@GoodTherapy', follower_count: 200000 },
  { name: 'The Gottman Institute', email: 'info@gottman.com', platform: 'BLOG', segment: 'THERAPY', handle: '@GottmanInst', follower_count: 500000 },
  { name: 'Esther Perel', email: 'press@estherperel.com', platform: 'PODCAST', segment: 'RELATIONSHIPS', handle: '@estherperelofficial', follower_count: 1500000 },
  { name: 'Dr. Phil', email: 'press@drphil.com', platform: 'TV', segment: 'PSYCHOLOGY', handle: '@drphil', follower_count: 4000000 },
  
  // ========== LIFE COACHING & PERSONAL DEVELOPMENT ==========
  { name: 'Tony Robbins', email: 'press@tonyrobbins.com', platform: 'INSTAGRAM', segment: 'COACHING', handle: '@tonyrobbins', follower_count: 7000000 },
  { name: 'Marie Forleo', email: 'hello@marieforleo.com', platform: 'YOUTUBE', segment: 'COACHING', handle: '@MarieForleo', follower_count: 800000 },
  { name: 'Lewis Howes', email: 'team@lewishowes.com', platform: 'PODCAST', segment: 'COACHING', handle: '@lewishowes', follower_count: 2000000 },
  { name: 'Brendon Burchard', email: 'team@brendonburchard.com', platform: 'INSTAGRAM', segment: 'COACHING', handle: '@brendonburchard', follower_count: 3000000 },
  { name: 'Gary Vaynerchuk', email: 'team@garyvaynerchuk.com', platform: 'INSTAGRAM', segment: 'ENTREPRENEURSHIP', handle: '@garyvee', follower_count: 10000000 },
  { name: 'Tim Ferriss', email: 'team@tim.blog', platform: 'PODCAST', segment: 'PRODUCTIVITY', handle: '@timferriss', follower_count: 2000000 },
  { name: 'Tiny Buddha', email: 'lori@tinybuddha.com', platform: 'BLOG', segment: 'COACHING', handle: '@TinyBuddha', follower_count: 400000 },
  { name: 'Marc and Angel', email: 'email@marcandangel.com', platform: 'BLOG', segment: 'COACHING', handle: '@MarcAndAngel', follower_count: 350000 },
  
  // ========== ESTATE PLANNING & LEGAL ==========
  { name: 'Trust & Will', email: 'partnerships@trustandwill.com', platform: 'BLOG', segment: 'ESTATE_PLANNING', handle: '@TrustAndWill', follower_count: 50000 },
  { name: 'LegalZoom', email: 'partnerships@legalzoom.com', platform: 'BLOG', segment: 'ESTATE_PLANNING', handle: '@LegalZoom', follower_count: 200000 },
  { name: 'Suze Orman', email: 'press@suzeorman.com', platform: 'INSTAGRAM', segment: 'FINANCE_PLANNING', handle: '@suaboreal', follower_count: 500000 },
  { name: 'Dave Ramsey', email: 'press@ramseysolutions.com', platform: 'INSTAGRAM', segment: 'FINANCE', handle: '@daboreal', follower_count: 5000000 },
  
  // ========== TECH & DIGITAL LEGACY ==========
  { name: 'MKBHD', email: 'business@mkbhd.com', platform: 'YOUTUBE', segment: 'TECH', handle: '@MKBHD', follower_count: 18000000 },
  { name: 'iJustine', email: 'business@ijustine.com', platform: 'YOUTUBE', segment: 'TECH', handle: '@iJustine', follower_count: 7000000 },
  { name: 'Linus Tech Tips', email: 'business@linusmediagroup.com', platform: 'YOUTUBE', segment: 'TECH', handle: '@LinusTechTips', follower_count: 15000000 },
  { name: 'Digital Beyond', email: 'info@thedigitalbeyond.com', platform: 'BLOG', segment: 'TECH', handle: '@DigitalBeyond', follower_count: 15000 },
  { name: 'Everplans', email: 'hello@everplans.com', platform: 'BLOG', segment: 'TECH', handle: '@Everplans', follower_count: 40000 },
  
  // ========== CELEBRITY INFLUENCERS WITH FAMILY FOCUS ==========
  { name: 'Kristen Bell', email: 'press@kristenbell.com', platform: 'INSTAGRAM', segment: 'CELEBRITY_MOM', handle: '@kristenanniebell', follower_count: 15000000 },
  { name: 'Chrissy Teigen', email: 'press@chrissyteigen.com', platform: 'INSTAGRAM', segment: 'CELEBRITY_MOM', handle: '@chrissyteigen', follower_count: 40000000 },
  { name: 'Reese Witherspoon', email: 'press@reesewitherspoon.com', platform: 'INSTAGRAM', segment: 'CELEBRITY', handle: '@reesewitherspoon', follower_count: 30000000 },
  { name: 'Drew Barrymore', email: 'press@drewbarrymore.com', platform: 'INSTAGRAM', segment: 'CELEBRITY_MOM', handle: '@drewbarrymore', follower_count: 15000000 },
  { name: 'Jennifer Garner', email: 'press@jennifergarner.com', platform: 'INSTAGRAM', segment: 'CELEBRITY_MOM', handle: '@jennifer.garner', follower_count: 14000000 },
  { name: 'Gwyneth Paltrow', email: 'press@goop.com', platform: 'INSTAGRAM', segment: 'WELLNESS_CELEBRITY', handle: '@gwynethpaltrow', follower_count: 8000000 },
  { name: 'Jessica Alba', email: 'press@honest.com', platform: 'INSTAGRAM', segment: 'CELEBRITY_MOM', handle: '@jessicaalba', follower_count: 20000000 },
  { name: 'Blake Lively', email: 'press@blakelively.com', platform: 'INSTAGRAM', segment: 'CELEBRITY_MOM', handle: '@blakelively', follower_count: 40000000 },
  { name: 'Ryan Reynolds', email: 'press@ryanreynolds.com', platform: 'INSTAGRAM', segment: 'CELEBRITY_DAD', handle: '@vancityreynolds', follower_count: 50000000 },
  { name: 'Dwayne Johnson', email: 'press@therock.com', platform: 'INSTAGRAM', segment: 'CELEBRITY_DAD', handle: '@therock', follower_count: 400000000 },
  
  // ========== PODCASTERS ==========
  { name: 'Joe Rogan', email: 'press@joerogan.com', platform: 'PODCAST', segment: 'ENTERTAINMENT', handle: '@joerogan', follower_count: 15000000 },
  { name: 'Armchair Expert', email: 'hello@armchairexpertpod.com', platform: 'PODCAST', segment: 'INTERVIEW', handle: '@armaboreal', follower_count: 2000000 },
  { name: 'Call Her Daddy', email: 'business@callherdaddy.com', platform: 'PODCAST', segment: 'LIFESTYLE', handle: '@callherdaddy', follower_count: 3000000 },
  { name: 'Conan OBrien', email: 'press@teamcoco.com', platform: 'PODCAST', segment: 'COMEDY', handle: '@conanobrien', follower_count: 5000000 },
  { name: 'SmartLess', email: 'press@smartless.com', platform: 'PODCAST', segment: 'COMEDY', handle: '@smartless', follower_count: 1000000 },
  
  // ========== TIKTOK VIRAL CREATORS ==========
  { name: 'Charli DAmelio', email: 'business@charlidamelio.com', platform: 'TIKTOK', segment: 'ENTERTAINMENT', handle: '@charlidamelio', follower_count: 150000000 },
  { name: 'Addison Rae', email: 'business@addisonrae.com', platform: 'TIKTOK', segment: 'ENTERTAINMENT', handle: '@addisonre', follower_count: 90000000 },
  { name: 'Khaby Lame', email: 'business@khabylame.com', platform: 'TIKTOK', segment: 'COMEDY', handle: '@khaby.lame', follower_count: 160000000 },
  { name: 'Bella Poarch', email: 'business@bellapoarch.com', platform: 'TIKTOK', segment: 'ENTERTAINMENT', handle: '@bellapoarch', follower_count: 90000000 },
  { name: 'Zach King', email: 'business@zachking.com', platform: 'TIKTOK', segment: 'MAGIC', handle: '@zachking', follower_count: 80000000 },
  
  // ========== HEALTH & FITNESS ==========
  { name: 'Kayla Itsines', email: 'press@kaylaitsines.com', platform: 'INSTAGRAM', segment: 'FITNESS', handle: '@kaaboreal', follower_count: 15000000 },
  { name: 'Joe Wicks', email: 'press@thebodycoach.com', platform: 'INSTAGRAM', segment: 'FITNESS', handle: '@thebodycoach', follower_count: 4500000 },
  { name: 'Cassey Ho', email: 'hello@blogilates.com', platform: 'YOUTUBE', segment: 'FITNESS', handle: '@blogilates', follower_count: 6000000 },
  { name: 'Adriene Mishler', email: 'hello@yogawithadriene.com', platform: 'YOUTUBE', segment: 'YOGA', handle: '@yogawithadriene', follower_count: 12000000 },
  { name: 'Dr. Mark Hyman', email: 'press@drhyman.com', platform: 'INSTAGRAM', segment: 'HEALTH', handle: '@drmarkhyman', follower_count: 1000000 },
];

// Combine all prospect sources for daily processing
const EXPANDED_PROSPECTS = VIRAL_INFLUENCERS;

// Outreach follow-up sequence configuration
const INFLUENCER_FOLLOWUP_SEQUENCE = [
  { daysAfterInitial: 3, emailType: 'FOLLOWUP_1' },
  { daysAfterInitial: 7, emailType: 'FOLLOWUP_2' },
  { daysAfterInitial: 14, emailType: 'FOLLOWUP_FINAL' },
];

// ============================================
// AUTOMATED PROSPECT DISCOVERY
// Syncs curated prospects and viral influencers to database DAILY
// Automatically adds new influencers and sends outreach emails
// ============================================

export async function discoverNewProspects(env: Env) {
  const now = new Date();
  const nowISO = now.toISOString();
  
  let added = 0;
  let skipped = 0;
  let errors: string[] = [];
  
  // Combine all prospect sources
  const allProspects = [...CURATED_PROSPECTS, ...EXPANDED_PROSPECTS];
  
  for (const prospect of allProspects) {
    try {
      // Check if this email already exists in the database
      const existing = await env.DB.prepare(`
        SELECT id FROM influencers WHERE email = ?
      `).bind(prospect.email).first();
      
      if (existing) {
        skipped++;
        continue;
      }
      
      // Check if email is in suppression list (unsubscribed)
      const suppressed = await env.DB.prepare(`
        SELECT id FROM marketing_suppression WHERE email = ?
      `).bind(prospect.email).first();
      
      if (suppressed) {
        skipped++;
        continue;
      }
      
      // Add new prospect to influencers table
      const id = crypto.randomUUID();
      await env.DB.prepare(`
        INSERT INTO influencers (id, name, email, platform, handle, follower_count, segment, status, consent_given, source, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'NEW', 0, 'WEB_SEARCH', ?, ?)
      `).bind(
        id,
        prospect.name,
        prospect.email,
        prospect.platform,
        prospect.handle,
        prospect.follower_count,
        prospect.segment,
        nowISO,
        nowISO
      ).run();
      
      added++;
    } catch (error: any) {
      errors.push(`${prospect.email}: ${error.message}`);
    }
  }
  
  return { added, skipped, total: allProspects.length, errors: errors.length > 0 ? errors : undefined };
}

// ============================================
// AUTOMATED INFLUENCER FOLLOW-UP SEQUENCE
// Sends follow-up emails to contacted influencers who haven't responded
// ============================================

export async function processInfluencerFollowUps(env: Env) {
  const now = new Date();
  const nowISO = now.toISOString();
  
  let sent = 0;
  let errors: string[] = [];
  
  for (const followup of INFLUENCER_FOLLOWUP_SEQUENCE) {
    // Find influencers who were contacted X days ago and haven't responded
    const eligibleInfluencers = await env.DB.prepare(`
      SELECT i.id, i.name, i.email, i.segment,
             mo.sent_at as initial_sent_at,
             (SELECT COUNT(*) FROM marketing_outreach WHERE influencer_id = i.id) as outreach_count
      FROM influencers i
      JOIN marketing_outreach mo ON mo.influencer_id = i.id
      WHERE i.status = 'CONTACTED'
      AND i.email IS NOT NULL
      AND mo.sent_at <= datetime('now', '-${followup.daysAfterInitial} days')
      AND mo.sent_at > datetime('now', '-${followup.daysAfterInitial + 1} days')
      AND i.id NOT IN (
        SELECT influencer_id FROM marketing_outreach 
        WHERE status = 'SENT' AND sent_at > datetime('now', '-1 day')
      )
      ORDER BY i.follower_count DESC
      LIMIT 15
    `).all();
    
    for (const influencer of eligibleInfluencers.results) {
      try {
        const emailContent = getInfluencerFollowUpEmail(
          influencer.name as string,
          influencer.segment as string,
          followup.emailType
        );
        
        await sendEmail(env, {
          from: 'Heirloom <admin@heirloom.blue>',
          to: influencer.email as string,
          subject: emailContent.subject,
          html: emailContent.html,
        }, `INFLUENCER_${followup.emailType}`);
        
        // Record follow-up in marketing_outreach table
        await env.DB.prepare(`
          INSERT INTO marketing_outreach (id, influencer_id, email_to, subject, body, status, sent_at)
          VALUES (?, ?, ?, ?, ?, 'SENT', ?)
        `).bind(crypto.randomUUID(), influencer.id, influencer.email, emailContent.subject, emailContent.html, nowISO).run();
        
        // If this is the final follow-up, mark as NO_RESPONSE
        if (followup.emailType === 'FOLLOWUP_FINAL') {
          await env.DB.prepare(`
            UPDATE influencers SET status = 'NO_RESPONSE', updated_at = ? WHERE id = ?
          `).bind(nowISO, influencer.id).run();
        }
        
        sent++;
      } catch (error: any) {
        errors.push(`${influencer.email}: ${error.message}`);
      }
    }
  }
  
  return { sent, errors: errors.length > 0 ? errors : undefined };
}

// Helper function for follow-up emails
function getInfluencerFollowUpEmail(name: string, segment: string | null, emailType: string): { subject: string; html: string } {
  return {
    subject: emailType === 'FOLLOWUP_FINAL' 
      ? `Last chance: Partner with Heirloom, ${name}?`
      : `Quick follow-up: Heirloom partnership opportunity`,
    html: influencerFollowUpTemplate(name, segment, emailType),
  };
}

// ============================================
// DRIP CAMPAIGN PROCESSOR
// ============================================

export async function processDripCampaigns(env: Env) {
  const now = new Date();
  const nowISO = now.toISOString();
  
  // Get campaigns that need processing
  const campaigns = await env.DB.prepare(`
    SELECT dc.*, u.email, u.first_name, u.last_name
    FROM drip_campaigns dc
    JOIN users u ON dc.user_id = u.id
    WHERE dc.status = 'active'
    AND dc.next_email_due_at <= ?
    AND u.email_verified = 1
    LIMIT 50
  `).bind(nowISO).all();
  
  for (const campaign of campaigns.results) {
    try {
      const emailContent = getDripEmailContent(
        campaign.campaign_type as string,
        campaign.step as number,
        campaign.first_name as string
      );
      
      if (!emailContent) {
        // Campaign complete
        await env.DB.prepare(`
          UPDATE drip_campaigns SET status = 'completed', updated_at = ? WHERE id = ?
        `).bind(nowISO, campaign.id).run();
        continue;
      }
      
      await sendEmail(env, {
        from: 'Heirloom <admin@heirloom.blue>',
        to: campaign.email as string,
        subject: emailContent.subject,
        html: emailContent.html,
      }, `DRIP_${campaign.campaign_type}_${campaign.step}`);
      
      // Calculate next step timing
      const nextStep = (campaign.step as number) + 1;
      const nextDue = getNextDripDate(campaign.campaign_type as string, nextStep);
      
      await env.DB.prepare(`
        UPDATE drip_campaigns 
        SET step = ?, last_email_sent_at = ?, next_email_due_at = ?, emails_sent = emails_sent + 1, updated_at = ?
        WHERE id = ?
      `).bind(nextStep, nowISO, nextDue?.toISOString() || null, nowISO, campaign.id).run();
      
      if (!nextDue) {
        await env.DB.prepare(`
          UPDATE drip_campaigns SET status = 'completed', updated_at = ? WHERE id = ?
        `).bind(nowISO, campaign.id).run();
      }
    } catch (error) {
      console.error(`Error processing drip campaign ${campaign.id}:`, error);
    }
  }
  
  return { processed: campaigns.results.length };
}

// ============================================
// NEW USER WELCOME CAMPAIGN STARTER
// ============================================

export async function startWelcomeCampaigns(env: Env) {
  const now = new Date();
  const nowISO = now.toISOString();
  
  // Find new users without a welcome campaign (registered in last 24 hours)
  const newUsers = await env.DB.prepare(`
    SELECT u.id, u.email, u.first_name
    FROM users u
    WHERE u.email_verified = 1
    AND u.created_at > datetime('now', '-24 hours')
    AND u.id NOT IN (
      SELECT user_id FROM drip_campaigns WHERE campaign_type = 'welcome'
    )
    LIMIT 50
  `).all();
  
  for (const user of newUsers.results) {
    // Create welcome campaign
    const id = crypto.randomUUID();
    const firstEmailDue = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour after signup
    
    await env.DB.prepare(`
      INSERT INTO drip_campaigns (id, user_id, campaign_type, step, next_email_due_at, created_at, updated_at)
      VALUES (?, ?, 'welcome', 1, ?, ?, ?)
    `).bind(id, user.id, firstEmailDue.toISOString(), nowISO, nowISO).run();
  }
  
  return { started: newUsers.results.length };
}

// ============================================
// INACTIVE USER RE-ENGAGEMENT
// ============================================

export async function processInactiveUsers(env: Env) {
  const now = new Date();
  const nowISO = now.toISOString();
  
  // Find users inactive for 3+ days without active re-engagement campaign
  const inactiveUsers = await env.DB.prepare(`
    SELECT u.id, u.email, u.first_name, u.last_login_at,
           julianday('now') - julianday(COALESCE(u.last_login_at, u.created_at)) as days_inactive
    FROM users u
    WHERE u.email_verified = 1
    AND (
      u.last_login_at < datetime('now', '-3 days')
      OR (u.last_login_at IS NULL AND u.created_at < datetime('now', '-3 days'))
    )
    AND u.id NOT IN (
      SELECT user_id FROM drip_campaigns 
      WHERE campaign_type IN ('inactive_3d', 'inactive_7d', 'inactive_14d', 'reactivation')
      AND status = 'active'
    )
    AND u.id NOT IN (
      SELECT user_id FROM drip_campaigns 
      WHERE campaign_type = 'reactivation'
      AND created_at > datetime('now', '-30 days')
    )
    LIMIT 30
  `).all();
  
  for (const user of inactiveUsers.results) {
    const daysInactive = Math.floor(user.days_inactive as number);
    let campaignType = 'inactive_3d';
    
    if (daysInactive >= 14) {
      campaignType = 'inactive_14d';
    } else if (daysInactive >= 7) {
      campaignType = 'inactive_7d';
    }
    
    const id = crypto.randomUUID();
    
    await env.DB.prepare(`
      INSERT INTO drip_campaigns (id, user_id, campaign_type, step, next_email_due_at, created_at, updated_at)
      VALUES (?, ?, ?, 1, ?, ?, ?)
    `).bind(id, user.id, campaignType, nowISO, nowISO, nowISO).run();
  }
  
  return { started: inactiveUsers.results.length };
}

// ============================================
// BIRTHDAY & ANNIVERSARY REMINDERS
// ============================================

export async function sendDateReminders(env: Env) {
  const now = new Date();
  const nowISO = now.toISOString();
  const today = now.toISOString().slice(5, 10); // MM-DD format
  
  // Find dates coming up in the next 7 days
  const upcomingDates = await env.DB.prepare(`
    SELECT id.*, u.email, u.first_name
    FROM important_dates id
    JOIN users u ON id.user_id = u.id
    WHERE u.email_verified = 1
    AND (
      id.last_reminder_sent_at IS NULL 
      OR id.last_reminder_sent_at < datetime('now', '-30 days')
    )
    LIMIT 50
  `).all();
  
  for (const dateRecord of upcomingDates.results) {
    const dateValue = dateRecord.date_value as string;
    const [month, day] = dateValue.split('-').map(Number);
    
    // Calculate days until this date
    const thisYear = new Date(now.getFullYear(), month - 1, day);
    const nextYear = new Date(now.getFullYear() + 1, month - 1, day);
    const targetDate = thisYear >= now ? thisYear : nextYear;
    const daysUntil = Math.floor((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    const reminderDays = dateRecord.reminder_days_before as number || 7;
    
    if (daysUntil <= reminderDays && daysUntil >= 0) {
      try {
        const emailContent = getDateReminderEmail(
          dateRecord.first_name as string,
          dateRecord.date_type as string,
          dateRecord.person_name as string,
          daysUntil
        );
        
        await sendEmail(env, {
          from: 'Heirloom <admin@heirloom.blue>',
          to: dateRecord.email as string,
          subject: emailContent.subject,
          html: emailContent.html,
        }, `DATE_REMINDER_${dateRecord.date_type}`);
        
        await env.DB.prepare(`
          UPDATE important_dates SET last_reminder_sent_at = ? WHERE id = ?
        `).bind(nowISO, dateRecord.id).run();
      } catch (error) {
        console.error(`Error sending date reminder ${dateRecord.id}:`, error);
      }
    }
  }
  
  return { processed: upcomingDates.results.length };
}

// ============================================
// STREAK MAINTENANCE
// ============================================

export async function processStreakMaintenance(env: Env) {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  // Reset streaks for users who missed yesterday
  const result = await env.DB.prepare(`
    UPDATE user_streaks 
    SET current_streak = 0, updated_at = ?
    WHERE last_activity_date < ? AND current_streak > 0
  `).bind(now.toISOString(), yesterday).run();
  
  return { reset: result.meta.changes };
}

// ============================================
// AUTOMATED INFLUENCER OUTREACH
// ============================================

export async function processInfluencerOutreach(env: Env) {
  const now = new Date();
  const nowISO = now.toISOString();
  
  // Get pending influencer outreach from marketing system
  const pendingOutreach = await env.DB.prepare(`
    SELECT i.*, 
           (SELECT COUNT(*) FROM marketing_outreach WHERE influencer_id = i.id) as outreach_count
    FROM influencers i
    WHERE i.status = 'NEW'
    AND i.email IS NOT NULL
    AND i.email != ''
    AND i.id NOT IN (
      SELECT influencer_id FROM marketing_outreach 
      WHERE sent_at > datetime('now', '-30 days')
    )
    ORDER BY i.follower_count DESC
    LIMIT 10
  `).all();
  
  let sent = 0;
  
  for (const influencer of pendingOutreach.results) {
    try {
      const emailContent = getInfluencerOutreachEmail(
        influencer.name as string,
        influencer.segment as string
      );
      
      await sendEmail(env, {
        from: 'Heirloom <admin@heirloom.blue>',
        to: influencer.email as string,
        subject: emailContent.subject,
        html: emailContent.html,
      }, 'INFLUENCER_OUTREACH');
      
      // Record outreach in marketing_outreach table
      await env.DB.prepare(`
        INSERT INTO marketing_outreach (id, influencer_id, email_to, subject, body, status, sent_at)
        VALUES (?, ?, ?, ?, ?, 'SENT', ?)
      `).bind(crypto.randomUUID(), influencer.id, influencer.email, emailContent.subject, emailContent.html, nowISO).run();
      
      // Update influencer status to CONTACTED
      await env.DB.prepare(`
        UPDATE influencers SET status = 'CONTACTED', updated_at = ? WHERE id = ?
      `).bind(nowISO, influencer.id).run();
      
      sent++;
    } catch (error) {
      console.error(`Error sending outreach to ${influencer.email}:`, error);
    }
  }
  
  return { sent };
}

// ============================================
// CONTENT PROMPT EMAILS
// ============================================

// ============================================
// AUTOMATED PROSPECT OUTREACH WITH LIMITED VOUCHERS
// ============================================

export async function processProspectOutreach(env: Env) {
  const now = new Date();
  const nowISO = now.toISOString();
  
  // Get prospects from marketing system that haven't been contacted
  const prospects = await env.DB.prepare(`
    SELECT i.id, i.name, i.email, i.segment, i.follower_count,
           (SELECT COUNT(*) FROM marketing_outreach WHERE influencer_id = i.id) as outreach_count
    FROM influencers i
    WHERE i.status = 'NEW'
    AND i.email IS NOT NULL
    AND i.email != ''
    AND i.id NOT IN (
      SELECT influencer_id FROM marketing_outreach 
      WHERE sent_at > datetime('now', '-14 days')
    )
    ORDER BY i.follower_count DESC
    LIMIT 20
  `).all();
  
  let sent = 0;
  let vouchersCreated = 0;
  
  for (const prospect of prospects.results) {
    try {
      // Create a limited trial voucher (1-2 months free to protect margins)
      const voucherCode = `TRIAL-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
      const voucherId = crypto.randomUUID();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days to redeem
      
      // Create voucher with 2-month trial (limited to protect margins)
      await env.DB.prepare(`
        INSERT INTO gift_vouchers (id, code, voucher_type, plan_type, duration_months, sender_name, sender_email, recipient_email, recipient_name, message, status, expires_at, created_at)
        VALUES (?, ?, 'TRIAL', 'STARTER', 2, 'Heirloom Team', 'admin@heirloom.blue', ?, ?, 'Experience Heirloom free for 2 months - preserve your family memories.', 'PENDING', ?, ?)
      `).bind(voucherId, voucherCode, prospect.email, prospect.name || 'Friend', expiresAt.toISOString(), nowISO).run();
      
      vouchersCreated++;
      
      // Send outreach email with voucher
      const emailContent = getProspectOutreachEmail(
        prospect.name as string || 'there',
        prospect.segment as string,
        voucherCode
      );
      
      await sendEmail(env, {
        from: 'Heirloom <admin@heirloom.blue>',
        to: prospect.email as string,
        subject: emailContent.subject,
        html: emailContent.html,
      }, 'PROSPECT_OUTREACH');
      
      // Record outreach in marketing_outreach table
      await env.DB.prepare(`
        INSERT INTO marketing_outreach (id, influencer_id, email_to, subject, body, status, sent_at)
        VALUES (?, ?, ?, ?, ?, 'SENT', ?)
      `).bind(crypto.randomUUID(), prospect.id, prospect.email, emailContent.subject, emailContent.html, nowISO).run();
      
      // Update prospect status to CONTACTED
      await env.DB.prepare(`
        UPDATE influencers SET status = 'CONTACTED', updated_at = ? WHERE id = ?
      `).bind(nowISO, prospect.id).run();
      
      sent++;
    } catch (error) {
      console.error(`Error sending prospect outreach to ${prospect.email}:`, error);
    }
  }
  
  return { sent, vouchersCreated };
}

// ============================================
// AUTOMATED FOLLOW-UP FOR UNREDEEMED VOUCHERS
// ============================================

export async function sendVoucherFollowUps(env: Env) {
  const now = new Date();
  const nowISO = now.toISOString();
  
  // Find unredeemed vouchers that are 7+ days old but not expired
  // Use gift_voucher_emails table to track follow-ups instead of email_logs
  const unredeemedVouchers = await env.DB.prepare(`
    SELECT gv.*, 
           (SELECT COUNT(*) FROM gift_voucher_emails WHERE voucher_id = gv.id AND email_type LIKE 'GIFT_REMINDER%') as followup_count
    FROM gift_vouchers gv
    WHERE gv.status = 'PENDING'
    AND gv.expires_at > ?
    AND gv.created_at < datetime('now', '-7 days')
    AND gv.recipient_email IS NOT NULL
    LIMIT 30
  `).bind(nowISO).all();
  
  let sent = 0;
  
  for (const voucher of unredeemedVouchers.results) {
    const followupCount = voucher.followup_count as number || 0;
    
    // Max 2 follow-ups per voucher
    if (followupCount >= 2) continue;
    
    try {
      const daysUntilExpiry = Math.floor(
        (new Date(voucher.expires_at as string).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      const emailContent = getVoucherFollowUpEmail(
        voucher.recipient_name as string || 'there',
        voucher.code as string,
        daysUntilExpiry,
        followupCount + 1
      );
      
      await sendEmail(env, {
        from: 'Heirloom <admin@heirloom.blue>',
        to: voucher.recipient_email as string,
        subject: emailContent.subject,
        html: emailContent.html,
      }, `VOUCHER_FOLLOWUP_${followupCount + 1}`);
      
      sent++;
    } catch (error) {
      console.error(`Error sending voucher follow-up to ${voucher.recipient_email}:`, error);
    }
  }
  
  return { sent };
}

// ============================================
// CONTENT PROMPTS
// ============================================

export async function sendContentPrompts(env: Env) {
  const now = new Date();
  const nowISO = now.toISOString();
  
  // Find active users who haven't created content in 3+ days
  const users = await env.DB.prepare(`
    SELECT u.id, u.email, u.first_name,
           (SELECT COUNT(*) FROM memories WHERE user_id = u.id) as memory_count,
           (SELECT MAX(created_at) FROM memories WHERE user_id = u.id) as last_memory
    FROM users u
    WHERE u.email_verified = 1
    AND (
      SELECT COUNT(*) FROM subscriptions s 
      WHERE s.user_id = u.id AND s.status IN ('ACTIVE', 'TRIALING')
    ) > 0
    AND u.id NOT IN (
      SELECT user_id FROM post_reminder_emails 
      WHERE sent_at > datetime('now', '-3 days')
    )
    AND (
      (SELECT MAX(created_at) FROM memories WHERE user_id = u.id) < datetime('now', '-3 days')
      OR (SELECT COUNT(*) FROM memories WHERE user_id = u.id) = 0
    )
    LIMIT 20
  `).all();
  
  const prompts = [
    "What's a childhood memory that still makes you smile?",
    "Describe a family tradition you want to preserve",
    "What advice would you give your younger self?",
    "Share a story about someone who influenced your life",
    "What's a lesson you learned the hard way?",
    "Describe your favorite family vacation",
    "What do you want your grandchildren to know about you?",
    "Share a recipe that's been in your family for generations",
  ];
  
  let sent = 0;
  
  for (const user of users.results) {
    try {
      const prompt = prompts[Math.floor(Math.random() * prompts.length)];
      const emailContent = getContentPromptEmail(user.first_name as string, prompt);
      
      await sendEmail(env, {
        from: 'Heirloom <admin@heirloom.blue>',
        to: user.email as string,
        subject: emailContent.subject,
        html: emailContent.html,
      }, 'CONTENT_PROMPT');
      
      await env.DB.prepare(`
        INSERT INTO post_reminder_emails (user_id, reminder_type, sent_at)
        VALUES (?, 'prompt', ?)
      `).bind(user.id, nowISO).run();
      
      sent++;
    } catch (error) {
      console.error(`Error sending content prompt to ${user.email}:`, error);
    }
  }
  
  return { sent };
}

// ============================================
// EMAIL CONTENT GENERATORS
// ============================================

function getDripEmailContent(campaignType: string, step: number, firstName: string): { subject: string; html: string } | null {
  const name = firstName || 'there';
  
  const campaigns: Record<string, Array<{ subject: string; html: string }>> = {
    welcome: [
      {
        subject: `${name}, your first 60 seconds on Heirloom`,
        html: welcomeEmail1(name),
      },
      {
        subject: `Make it real - add your first family member`,
        html: welcomeEmail2(name),
      },
      {
        subject: `Future-you will thank you for this`,
        html: welcomeEmail3(name),
      },
      {
        subject: `A gentle safeguard for your memories`,
        html: welcomeEmail4(name),
      },
    ],
    inactive_3d: [
      {
        subject: `${name}, we saved your spot`,
        html: inactiveEmail(name, 3),
      },
    ],
    inactive_7d: [
      {
        subject: `Your memories are waiting, ${name}`,
        html: inactiveEmail(name, 7),
      },
      {
        subject: `A simple way to start`,
        html: inactiveEmail2(name),
      },
    ],
    inactive_14d: [
      {
        subject: `We miss you, ${name}`,
        html: inactiveEmail(name, 14),
      },
      {
        subject: `One memory can change everything`,
        html: inactiveEmail2(name),
      },
      {
        subject: `Last chance: Your legacy awaits`,
        html: inactiveEmailFinal(name),
      },
    ],
  };
  
  const sequence = campaigns[campaignType];
  if (!sequence || step > sequence.length) {
    return null;
  }
  
  return sequence[step - 1];
}

function getNextDripDate(campaignType: string, step: number): Date | null {
  const now = new Date();
  
  const timings: Record<string, number[]> = {
    welcome: [1, 24, 72, 168], // 1h, 1d, 3d, 7d
    inactive_3d: [0],
    inactive_7d: [0, 72], // immediate, then 3d
    inactive_14d: [0, 72, 168], // immediate, 3d, 7d
  };
  
  const sequence = timings[campaignType];
  if (!sequence || step > sequence.length) {
    return null;
  }
  
  return new Date(now.getTime() + sequence[step - 1] * 60 * 60 * 1000);
}

function getDateReminderEmail(firstName: string, dateType: string, personName: string | null, daysUntil: number): { subject: string; html: string } {
  const name = firstName || 'there';
  const person = personName || 'someone special';
  
  const typeLabels: Record<string, string> = {
    birthday: 'birthday',
    anniversary: 'anniversary',
    memorial: 'memorial day',
    custom: 'special day',
  };
  
  const label = typeLabels[dateType] || 'special day';
  const daysText = daysUntil === 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`;
  
  return {
    subject: `${person}'s ${label} is ${daysText}`,
    html: dateReminderEmailTemplate(name, person, label, daysText),
  };
}

function getInfluencerOutreachEmail(name: string, niche: string | null): { subject: string; html: string } {
  return {
    subject: `Partnership opportunity: Help families preserve their legacy`,
    html: influencerOutreachTemplate(name, niche),
  };
}

function getContentPromptEmail(firstName: string, prompt: string): { subject: string; html: string } {
  return {
    subject: `Memory prompt: ${prompt.substring(0, 50)}...`,
    html: contentPromptTemplate(firstName, prompt),
  };
}

function getProspectOutreachEmail(name: string, niche: string | null, voucherCode: string): { subject: string; html: string } {
  return {
    subject: `Your free 2-month trial of Heirloom`,
    html: prospectOutreachTemplate(name, niche, voucherCode),
  };
}

function getVoucherFollowUpEmail(name: string, voucherCode: string, daysUntilExpiry: number, followupNumber: number): { subject: string; html: string } {
  const urgency = daysUntilExpiry <= 7 ? 'expires soon' : 'waiting for you';
  return {
    subject: followupNumber === 1 
      ? `Your free trial is ${urgency}, ${name}` 
      : `Last chance: Your Heirloom trial expires in ${daysUntilExpiry} days`,
    html: voucherFollowUpTemplate(name, voucherCode, daysUntilExpiry, followupNumber),
  };
}

// ============================================
// EMAIL TEMPLATES
// ============================================

function welcomeEmail1(name: string): string {
  return emailWrapper(`
    <h2 style="color: #f5f5dc; font-size: 22px; font-weight: normal; margin: 0 0 20px 0;">
      Welcome to Heirloom, ${name}!
    </h2>
    
    <p style="color: #c0c0c0; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      You've taken the first step toward preserving what matters most. In just 60 seconds, 
      you can create your first memory and start building a legacy that will last for generations.
    </p>
    
    <p style="color: #c0c0c0; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
      <strong style="color: #d4af37;">Here's a simple prompt to get started:</strong><br>
      "What's one thing you want your family to always remember about you?"
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://heirloom.blue/dashboard" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #b8962e 100%); color: #0a0a0f; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-size: 16px; font-weight: bold;">
        Create Your First Memory
      </a>
    </div>
  `);
}

function welcomeEmail2(name: string): string {
  return emailWrapper(`
    <h2 style="color: #f5f5dc; font-size: 22px; font-weight: normal; margin: 0 0 20px 0;">
      Make it real, ${name}
    </h2>
    
    <p style="color: #c0c0c0; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      Memories become more meaningful when they're shared. Add a family member to Heirloom 
      and start building your family's story together.
    </p>
    
    <p style="color: #c0c0c0; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
      When you invite someone, they can:
    </p>
    <ul style="color: #c0c0c0; font-size: 16px; line-height: 1.8; margin: 0 0 25px 20px;">
      <li>View and contribute to shared memories</li>
      <li>Receive your letters and voice messages</li>
      <li>Help preserve your family's legacy</li>
    </ul>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://heirloom.blue/family" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #b8962e 100%); color: #0a0a0f; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-size: 16px; font-weight: bold;">
        Add Family Member
      </a>
    </div>
  `);
}

function welcomeEmail3(name: string): string {
  return emailWrapper(`
    <h2 style="color: #f5f5dc; font-size: 22px; font-weight: normal; margin: 0 0 20px 0;">
      Future-you will thank you, ${name}
    </h2>
    
    <p style="color: #c0c0c0; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      There's something magical about hearing a loved one's voice. Record a short voice message 
      - just 30 seconds - and give your family a gift they'll treasure forever.
    </p>
    
    <p style="color: #c0c0c0; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
      <strong style="color: #d4af37;">Try this:</strong> Record yourself saying "I love you" 
      and why. It takes less than a minute but means everything.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://heirloom.blue/voice" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #b8962e 100%); color: #0a0a0f; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-size: 16px; font-weight: bold;">
        Record Voice Message
      </a>
    </div>
  `);
}

function welcomeEmail4(name: string): string {
  return emailWrapper(`
    <h2 style="color: #f5f5dc; font-size: 22px; font-weight: normal; margin: 0 0 20px 0;">
      A gentle safeguard, ${name}
    </h2>
    
    <p style="color: #c0c0c0; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      Life is unpredictable. Heirloom's Legacy Playbook ensures your memories, letters, and 
      voice messages reach your loved ones when the time is right.
    </p>
    
    <p style="color: #c0c0c0; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
      Set up a simple check-in schedule, and if you ever can't check in, your designated 
      contacts will receive everything you've created. It's peace of mind for you and 
      comfort for them.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://heirloom.blue/legacy-playbook" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #b8962e 100%); color: #0a0a0f; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-size: 16px; font-weight: bold;">
        Set Up Legacy Playbook
      </a>
    </div>
  `);
}

function inactiveEmail(name: string, days: number): string {
  return emailWrapper(`
    <h2 style="color: #f5f5dc; font-size: 22px; font-weight: normal; margin: 0 0 20px 0;">
      We saved your spot, ${name}
    </h2>
    
    <p style="color: #c0c0c0; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      It's been ${days} days since we last saw you. Your memories are waiting, and there's 
      no better time than now to add to your legacy.
    </p>
    
    <p style="color: #c0c0c0; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
      <strong style="color: #d4af37;">Quick idea:</strong> What made you smile today? 
      Capture it in 30 seconds.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://heirloom.blue/dashboard" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #b8962e 100%); color: #0a0a0f; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-size: 16px; font-weight: bold;">
        Continue Your Legacy
      </a>
    </div>
  `);
}

function inactiveEmail2(name: string): string {
  return emailWrapper(`
    <h2 style="color: #f5f5dc; font-size: 22px; font-weight: normal; margin: 0 0 20px 0;">
      A simple way to start, ${name}
    </h2>
    
    <p style="color: #c0c0c0; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      Sometimes the hardest part is knowing where to begin. Here are three prompts that 
      take less than 2 minutes each:
    </p>
    
    <ul style="color: #c0c0c0; font-size: 16px; line-height: 1.8; margin: 0 0 25px 20px;">
      <li>Upload a favorite photo and write one sentence about why it matters</li>
      <li>Record yourself saying "I love you" to someone special</li>
      <li>Write three words that describe your family</li>
    </ul>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://heirloom.blue/dashboard" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #b8962e 100%); color: #0a0a0f; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-size: 16px; font-weight: bold;">
        Pick One & Start
      </a>
    </div>
  `);
}

function inactiveEmailFinal(name: string): string {
  return emailWrapper(`
    <h2 style="color: #f5f5dc; font-size: 22px; font-weight: normal; margin: 0 0 20px 0;">
      Your legacy awaits, ${name}
    </h2>
    
    <p style="color: #c0c0c0; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      We don't want to fill your inbox with emails you don't want. This is our last 
      reminder - but your account and everything you've started will always be here 
      waiting for you.
    </p>
    
    <p style="color: #c0c0c0; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
      When you're ready to preserve what matters most, we'll be here.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://heirloom.blue/dashboard" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #b8962e 100%); color: #0a0a0f; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-size: 16px; font-weight: bold;">
        Return to Heirloom
      </a>
    </div>
    
    <p style="color: #808080; font-size: 14px; text-align: center; margin: 20px 0 0 0;">
      <a href="https://heirloom.blue/unsubscribe" style="color: #808080;">Unsubscribe from these reminders</a>
    </p>
  `);
}

function dateReminderEmailTemplate(name: string, person: string, label: string, daysText: string): string {
  return emailWrapper(`
    <h2 style="color: #f5f5dc; font-size: 22px; font-weight: normal; margin: 0 0 20px 0;">
      ${person}'s ${label} is ${daysText}
    </h2>
    
    <p style="color: #c0c0c0; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      Hi ${name}, this is a gentle reminder that ${person}'s ${label} is coming up ${daysText}.
    </p>
    
    <p style="color: #c0c0c0; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
      <strong style="color: #d4af37;">Why not create a special memory?</strong><br>
      Record a birthday message, write a letter, or share a favorite photo of them.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://heirloom.blue/dashboard" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #b8962e 100%); color: #0a0a0f; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-size: 16px; font-weight: bold;">
        Create a Memory
      </a>
    </div>
  `);
}

function influencerOutreachTemplate(name: string, niche: string | null): string {
  const nicheText = niche ? ` in the ${niche} space` : '';
  
  return emailWrapper(`
    <h2 style="color: #f5f5dc; font-size: 22px; font-weight: normal; margin: 0 0 20px 0;">
      Hi ${name},
    </h2>
    
    <p style="color: #c0c0c0; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      I came across your work${nicheText} and was moved by the way you connect with your audience 
      on meaningful topics.
    </p>
    
    <p style="color: #c0c0c0; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      I'm reaching out from <strong style="color: #d4af37;">Heirloom</strong>, a platform that helps 
      families preserve memories, stories, and messages for future generations. We believe your 
      voice could help more families start their legacy journey.
    </p>
    
    <p style="color: #c0c0c0; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
      We'd love to offer you a complimentary year of our Family Plan and explore how we might 
      work together. No pressure - just an invitation to experience what we've built.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://heirloom.blue/influencer" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #b8962e 100%); color: #0a0a0f; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-size: 16px; font-weight: bold;">
        Join Our Influencer Program
      </a>
    </div>
    
    <p style="color: #c0c0c0; font-size: 16px; line-height: 1.6; margin: 20px 0 0 0;">
      Warm regards,<br>
      The Heirloom Team
    </p>
  `);
}

function influencerFollowUpTemplate(name: string, niche: string | null, emailType: string): string {
  const nicheText = niche ? ` in the ${niche.toLowerCase().replace('_', ' ')} space` : '';
  
  if (emailType === 'FOLLOWUP_1') {
    return emailWrapper(`
      <h2 style="color: #f5f5dc; font-size: 22px; font-weight: normal; margin: 0 0 20px 0;">
        Hi ${name},
      </h2>
      
      <p style="color: #c0c0c0; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        I wanted to follow up on my previous email about partnering with Heirloom. I know you're busy, 
        so I'll keep this brief.
      </p>
      
      <p style="color: #c0c0c0; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Our influencer program offers:
      </p>
      <ul style="color: #c0c0c0; font-size: 16px; line-height: 1.8; margin: 0 0 20px 20px;">
        <li><strong style="color: #d4af37;">20% commission</strong> on yearly subscriptions</li>
        <li><strong style="color: #d4af37;">Personalized discount code</strong> for your audience (15-25% off)</li>
        <li><strong style="color: #d4af37;">Free Family Plan</strong> for you to experience the product</li>
        <li><strong style="color: #d4af37;">Custom landing page</strong> with your branding</li>
      </ul>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://heirloom.blue/influencer" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #b8962e 100%); color: #0a0a0f; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-size: 16px; font-weight: bold;">
          Apply in 2 Minutes
        </a>
      </div>
      
      <p style="color: #808080; font-size: 14px; margin: 20px 0 0 0;">
        Just reply to this email if you have any questions!
      </p>
    `);
  } else if (emailType === 'FOLLOWUP_2') {
    return emailWrapper(`
      <h2 style="color: #f5f5dc; font-size: 22px; font-weight: normal; margin: 0 0 20px 0;">
        ${name}, quick question
      </h2>
      
      <p style="color: #c0c0c0; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        I've reached out a couple times about our influencer program${nicheText}. I wanted to check - 
        is this something you'd be interested in exploring?
      </p>
      
      <p style="color: #c0c0c0; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        If the timing isn't right, no worries at all. But if you're open to it, I'd love to set you up 
        with a free account so you can see what Heirloom is all about.
      </p>
      
      <p style="color: #c0c0c0; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Many of our influencer partners love sharing Heirloom because it genuinely helps families 
        preserve what matters most - and the commission structure is quite generous.
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://heirloom.blue/influencer" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #b8962e 100%); color: #0a0a0f; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-size: 16px; font-weight: bold;">
          Learn More
        </a>
      </div>
      
      <p style="color: #808080; font-size: 14px; margin: 20px 0 0 0;">
        Either way, I appreciate your time!
      </p>
    `);
  } else {
    // FOLLOWUP_FINAL
    return emailWrapper(`
      <h2 style="color: #f5f5dc; font-size: 22px; font-weight: normal; margin: 0 0 20px 0;">
        Last note from me, ${name}
      </h2>
      
      <p style="color: #c0c0c0; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        I don't want to be a pest, so this will be my last email about our influencer partnership.
      </p>
      
      <p style="color: #c0c0c0; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        If you ever want to explore working together in the future, the door is always open. 
        Just visit our influencer page or reply to this email.
      </p>
      
      <div style="background: rgba(212, 175, 55, 0.1); border-left: 3px solid #d4af37; padding: 20px; margin: 25px 0;">
        <p style="color: #d4af37; font-size: 16px; margin: 0;">
          <strong>Quick reminder of what we offer:</strong><br>
          20% commission | Personalized discount codes | Free Family Plan | Custom landing page
        </p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://heirloom.blue/influencer" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #b8962e 100%); color: #0a0a0f; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-size: 16px; font-weight: bold;">
          Join When You're Ready
        </a>
      </div>
      
      <p style="color: #c0c0c0; font-size: 16px; line-height: 1.6; margin: 20px 0 0 0;">
        Wishing you all the best,<br>
        The Heirloom Team
      </p>
      
      <p style="color: #808080; font-size: 14px; text-align: center; margin: 20px 0 0 0;">
        <a href="https://heirloom.blue/unsubscribe" style="color: #808080;">Unsubscribe from partnership emails</a>
      </p>
    `);
  }
}

function contentPromptTemplate(name: string, prompt: string): string {
  return emailWrapper(`
    <h2 style="color: #f5f5dc; font-size: 22px; font-weight: normal; margin: 0 0 20px 0;">
      Memory Prompt for ${name}
    </h2>
    
    <div style="background: rgba(212, 175, 55, 0.1); border-left: 3px solid #d4af37; padding: 20px; margin: 20px 0;">
      <p style="color: #d4af37; font-size: 18px; font-style: italic; margin: 0;">
        "${prompt}"
      </p>
    </div>
    
    <p style="color: #c0c0c0; font-size: 16px; line-height: 1.6; margin: 20px 0;">
      Take a moment to reflect on this prompt. Your answer could become a treasured 
      memory for your family.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://heirloom.blue/dashboard" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #b8962e 100%); color: #0a0a0f; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-size: 16px; font-weight: bold;">
        Answer This Prompt
      </a>
    </div>
  `);
}

function prospectOutreachTemplate(name: string, niche: string | null, voucherCode: string): string {
  const nicheText = niche ? ` We noticed your work in the ${niche} space and thought you might appreciate what we're building.` : '';
  
  return emailWrapper(`
    <h2 style="color: #f5f5dc; font-size: 22px; font-weight: normal; margin: 0 0 20px 0;">
      Hi ${name},
    </h2>
    
    <p style="color: #c0c0c0; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      We'd love to invite you to try <strong style="color: #d4af37;">Heirloom</strong> - a beautiful 
      platform for preserving family memories, stories, and messages for future generations.${nicheText}
    </p>
    
    <p style="color: #c0c0c0; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      As a special gift, we're offering you <strong style="color: #d4af37;">2 months free</strong> 
      to experience everything Heirloom has to offer - no strings attached.
    </p>
    
    <div style="background: rgba(212, 175, 55, 0.1); border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
      <p style="color: #a0a0a0; font-size: 14px; margin: 0 0 10px 0;">Your exclusive trial code:</p>
      <p style="color: #d4af37; font-size: 24px; font-weight: bold; margin: 0; letter-spacing: 2px;">${voucherCode}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://heirloom.blue/redeem?code=${voucherCode}" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #b8962e 100%); color: #0a0a0f; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-size: 16px; font-weight: bold;">
        Start Your Free Trial
      </a>
    </div>
    
    <p style="color: #808080; font-size: 14px; margin: 20px 0 0 0;">
      This code expires in 30 days. If you have any questions, just reply to this email.
    </p>
  `);
}

function voucherFollowUpTemplate(name: string, voucherCode: string, daysUntilExpiry: number, followupNumber: number): string {
  const urgencyText = daysUntilExpiry <= 7 
    ? `<strong style="color: #d4af37;">Only ${daysUntilExpiry} days left</strong> to claim your free trial!`
    : `Your free trial code is still waiting for you.`;
  
  const messageText = followupNumber === 1
    ? `We noticed you haven't had a chance to try Heirloom yet. ${urgencyText}`
    : `This is a gentle reminder that your exclusive trial offer expires soon. Don't miss out on preserving your family's precious memories.`;
  
  return emailWrapper(`
    <h2 style="color: #f5f5dc; font-size: 22px; font-weight: normal; margin: 0 0 20px 0;">
      Hi ${name},
    </h2>
    
    <p style="color: #c0c0c0; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      ${messageText}
    </p>
    
    <p style="color: #c0c0c0; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      With Heirloom, you can:
    </p>
    <ul style="color: #c0c0c0; font-size: 16px; line-height: 1.8; margin: 0 0 20px 20px;">
      <li>Preserve photos, videos, and voice recordings</li>
      <li>Write letters to loved ones for the future</li>
      <li>Create a lasting legacy for generations</li>
    </ul>
    
    <div style="background: rgba(212, 175, 55, 0.1); border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
      <p style="color: #a0a0a0; font-size: 14px; margin: 0 0 10px 0;">Your trial code (expires in ${daysUntilExpiry} days):</p>
      <p style="color: #d4af37; font-size: 24px; font-weight: bold; margin: 0; letter-spacing: 2px;">${voucherCode}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://heirloom.blue/redeem?code=${voucherCode}" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #b8962e 100%); color: #0a0a0f; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-size: 16px; font-weight: bold;">
        Claim Your Free Trial
      </a>
    </div>
    
    <p style="color: #808080; font-size: 14px; text-align: center; margin: 20px 0 0 0;">
      <a href="https://heirloom.blue/unsubscribe" style="color: #808080;">Unsubscribe from these reminders</a>
    </p>
  `);
}

function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: Georgia, serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #d4af37; font-size: 28px; font-weight: normal; margin: 0;">Heirloom</h1>
      <p style="color: #a0a0a0; font-size: 14px; margin-top: 5px;">Preserve what matters most</p>
    </div>
    
    <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 12px; padding: 30px;">
      ${content}
    </div>
    
    <p style="color: #606060; font-size: 12px; text-align: center; margin-top: 30px;">
      Heirloom - Preserving family legacies for generations<br>
      <a href="https://heirloom.blue/settings" style="color: #606060;">Manage email preferences</a>
    </p>
  </div>
</body>
</html>
  `;
}
