export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  tag: string;
  tagColor: string;
  date: string;
  readTime: string;
  emoji: string;
  image: string;
  imgPosition?: string;
  featured?: boolean;
  content: string; // HTML string
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "why-personalised-stories-build-confidence",
    title: "Why personalised stories build confidence in children",
    excerpt:
      "When a child hears their own name in a story — when they are the hero — something extraordinary happens in their brain. Here's what the research says.",
    tag: "Child Development",
    tagColor: "#00c9a7",
    date: "12 Apr 2025",
    readTime: "5 min read",
    emoji: "📖",
    image: "/lf-scene-kite.png",
    imgPosition: "center 20%",
    featured: true,
    content: `
<p>There's a moment every parent recognises. You're reading a bedtime story, and suddenly your child's eyes go wide — not because a dragon appeared, but because the dragon's name is <em>their</em> name. That tiny detail changes everything.</p>

<p>Personalised stories aren't just a novelty. There's a growing body of research suggesting they meaningfully impact how children see themselves, how they process emotions, and how confident they feel in real-world situations.</p>

<h2>The name effect</h2>

<p>In a 2019 study published in the <em>Journal of Applied Developmental Psychology</em>, children aged 4–6 who regularly heard stories with themselves as the protagonist showed measurably higher self-efficacy scores — essentially, a stronger belief that they could handle challenges — compared to a control group who heard the same stories with generic characters.</p>

<p>The researchers' explanation is elegant: when a child hears their name in a story, their brain stops being a passive audience and starts being an active participant. The narrative becomes a kind of dress rehearsal for real life.</p>

<h2>Identity and the story we tell ourselves</h2>

<p>Psychologists have long known that narrative identity — the story we construct about who we are — begins forming around age 3. Children aren't just hearing stories; they're building a mental library of "stories about me" that shapes their self-concept for years.</p>

<p>When those stories consistently place them as brave, curious, kind, or resourceful, those traits start feeling true. Not in a false, empty-praise way. In a deep, story-anchored way that sticks.</p>

<p>This is particularly powerful for children who struggle with confidence in specific areas. A child who finds mathematics hard benefits enormously from a story where their character solves a problem using logic. A shy child who hears themselves described as "the one who always knew what to say when it mattered" internalises that possibility.</p>

<h2>What personalisation actually means</h2>

<p>Effective personalisation goes beyond just swapping in a name. The richest impact comes when stories incorporate:</p>

<ul>
  <li><strong>The child's genuine interests</strong> — their favourite animal, colour, food, activity</li>
  <li><strong>Real traits they demonstrate</strong> — curiosity, kindness, creativity</li>
  <li><strong>Age-appropriate challenges</strong> — problems that feel real to their current developmental stage</li>
  <li><strong>A resolution they can model</strong> — not a magical fix, but a recognisable human solution</li>
</ul>

<p>This is why at Lalli Fafa, we ask parents to tell us about their child before generating a single word of a story. Arjun's love of elephants isn't a throwaway detail — it's the thread the story wraps around.</p>

<h2>The confidence loop</h2>

<p>Here's what makes personalised stories particularly powerful over time: they create a confidence loop.</p>

<p>A child hears themselves as brave in a story → they feel a little braver in real life → when they act bravely, parents reflect that back → the child's identity as "a brave person" strengthens → they engage more boldly with the next story and the next challenge.</p>

<p>It's a slow flywheel, but it's real. And it starts with something as simple as a bedtime story where a little girl named Priya and a little boy named Rohan go on an adventure together.</p>

<h2>A note on language</h2>

<p>For bilingual families, this effect has an added dimension. Hearing your child's name — and their personality — woven into a story told in Hindi, their first language of home and heart, adds a layer of cultural identity affirmation that English alone simply cannot provide. "Tum bahut brave ho" lands differently when it's embedded in a story about a child who looks and sounds like them.</p>

<p>The research is clear, the mechanism is understood, and the application has never been simpler. The next story you tell your child could be the one they carry inside them for the rest of their life.</p>
    `,
  },
  {
    slug: "bedtime-routine-that-actually-works",
    title: "The bedtime routine that actually works (for 2–8 year olds)",
    excerpt:
      "Most bedtime routines fail because they treat sleep as a destination rather than a journey. Here's a simple framework that works — with stories at the centre.",
    tag: "Parenting Tips",
    tagColor: "#f9c700",
    date: "28 Mar 2025",
    readTime: "6 min read",
    emoji: "🌙",
    image: "/lf-scene-bedtime.png",
    imgPosition: "center 25%",
    content: `
<p>It's 9:15 PM. You've asked three times. You've negotiated. You've threatened (gently). You've promised. And your child is somehow more awake than they were at 7 PM, when you thought — optimistically — that bedtime would begin.</p>

<p>Sound familiar? You're not doing it wrong. You're just working against a few biological and psychological forces that, once understood, make everything easier.</p>

<h2>Why most bedtime routines fail</h2>

<p>The most common mistake is treating bedtime as a single event: "It's time to sleep." But for a child's brain, sleep isn't a switch. It's a gradual state that the nervous system needs to be guided into over 20–40 minutes.</p>

<p>Screens make this worse. The blue light and the stimulating content signal the brain to stay alert — and a child who's been watching a tablet at 8:30 PM is physiologically not ready to sleep at 8:45 PM, regardless of how tired they are.</p>

<p>The second mistake is inconsistency. Children's brains are pattern-seeking machines. A routine that varies nightly — sometimes bath, sometimes no bath, sometimes 9 PM, sometimes 10 PM — fails to create the neurological cues that signal "sleep is coming now."</p>

<h2>The 4-step framework (30 minutes total)</h2>

<p>Here's what the sleep science actually recommends, stripped of all the complicated jargon:</p>

<h3>Step 1: Wind-down signal (5 min)</h3>
<p>Something that happens at the same time every night and signals "active time is ending." This could be dimming the lights in the main room, a specific song, or simply saying "okay, it's wind-down time." The content matters less than the consistency.</p>

<h3>Step 2: Body care (10 min)</h3>
<p>Teeth, face, toilet, pyjamas. Keep this in a fixed order. The repetitive physical routine helps shift the nervous system out of high-alert mode. Some children find a warm bath here helpful; others find it overstimulating — you know your child.</p>

<h3>Step 3: The story (10–15 min)</h3>
<p>This is the most powerful part of any bedtime routine, and it's where most parents underinvest. A story serves three functions simultaneously: it gives the child a reason to get into bed willingly, it provides a gentle emotional download for the day, and it transitions the brain into the narrative, imaginative mode that is closest to the dreaming state.</p>

<p>The best bedtime stories are:</p>
<ul>
  <li>Calm in pace but emotionally rich</li>
  <li>Resolved — no cliffhangers that keep the mind active</li>
  <li>Familiar enough to be comforting but novel enough to be engaging</li>
  <li>Ideally, featuring the child as a character (personalised stories show higher sleep-association rates in children who hear them regularly)</li>
</ul>

<h3>Step 4: The transition (5 min)</h3>
<p>Lights off, one song or two minutes of quiet conversation about tomorrow, then out. The key here is not re-engaging. Don't start a new topic. Don't look at your phone (the light wakes both of you up). This transition needs to be unhurried but clear.</p>

<h2>Age-specific notes</h2>

<p><strong>Ages 2–3:</strong> Routine rigidity matters most here. Toddlers can become severely dysregulated by even small variations. Use the same story more than once — repetition is not boring to a toddler, it's reassuring.</p>

<p><strong>Ages 4–5:</strong> This is when children start wanting input. "Can we do the story about me and the elephant?" is a wonderful sign of healthy autonomy. Let them choose the theme.</p>

<p><strong>Ages 6–8:</strong> Children at this age often resist bedtime because they feel they're missing out. The story becomes even more important as a "reward" worth going to bed for. Slightly longer, more complex narratives work well — stories with a lesson or a mini-mystery that gets resolved within the story.</p>

<h2>The real goal</h2>

<p>The goal of a bedtime routine isn't just sleep tonight. It's the association your child builds between bedtime and safety, warmth, stories, and closeness. Children who have consistent, story-rich bedtime routines in early childhood show measurably lower anxiety levels in primary school — not because of the sleep itself, but because of what that daily ritual communicated about their world.</p>

<p>Start tonight. Even an imperfect routine, done consistently, is vastly better than a perfect routine done sporadically.</p>
    `,
  },
  {
    slug: "hindi-storytelling-bilingual-families",
    title: "Why Hindi storytelling matters for bilingual families",
    excerpt:
      "For children growing up between two languages, the language of their stories shapes the language of their inner life. Hindi bedtime stories do something English ones simply can't.",
    tag: "Language & Culture",
    tagColor: "#a855f7",
    date: "15 Mar 2025",
    readTime: "5 min read",
    emoji: "🇮🇳",
    image: "/lf-scene-krishna.png",
    imgPosition: "center 20%",
    content: `
<p>Ask most Indian parents in their 30s what language they dream in. Nine times out of ten, the answer is Hindi — or their mother tongue — even if they've lived abroad for a decade, even if they conduct their entire professional life in English.</p>

<p>Language isn't just a communication tool. It's the medium in which emotion is stored, memory is encoded, and identity is anchored. And for children growing up bilingual, which language their stories come in matters enormously.</p>

<h2>The language of the heart</h2>

<p>Linguists distinguish between a person's L1 (first language, typically the language of home and infancy) and their L2 (second language, typically acquired in school or formal settings). Emotional responses are processed differently depending on which language you use — L1 triggers deeper limbic system activation, meaning feelings hit harder and stick longer.</p>

<p>When a child hears a story in Hindi — the language spoken by their grandparents, the language of "Nani ki kahani" — it lands in a different part of their experience than an English story does. Both have value. But they are doing different things.</p>

<h2>What gets lost when we default to English</h2>

<p>Many bilingual Indian families, whether in India's metros or abroad, find themselves defaulting to English for stories. The books are better illustrated, the apps are smoother, the content library is larger. It's the path of least resistance.</p>

<p>But something quietly slips away. Children who receive all their narrative content in English — even when they speak Hindi at home — sometimes struggle to access Hindi as an expressive language. They can follow conversation but can't tell a story. They understand but can't create. The language of the heart becomes the language they can receive but not speak.</p>

<p>For children growing up in India itself, this has a different but related dimension: English becomes associated with ambition and competence, while Hindi — the language of home, family, folk tales — subtly gets coded as informal, less important. This is a loss with long cultural consequences.</p>

<h2>What Hindi stories give children</h2>

<p>A Hindi story isn't just the same content in a different language. It carries its own vocabulary for emotions, its own cadences of kindness, its own idioms that have no English equivalent:</p>

<ul>
  <li><em>Mann ki baat</em> — the things of the heart, unsaid but felt</li>
  <li><em>Himmat</em> — courage with a distinctly warm, earned quality</li>
  <li><em>Izzat</em> — respect that encompasses dignity, family honour, and social care</li>
  <li><em>Jugaad</em> — the particularly Indian art of creative problem-solving under constraints</li>
</ul>

<p>When a child hears that they showed "sacchi himmat" in their story, they're receiving a concept of courage that is rooted in their cultural context — not borrowed from a Western narrative tradition.</p>

<h2>The practical case for bilingual stories</h2>

<p>Research on bilingual language development is unambiguous: the more robust a child's L1, the better their L2 acquisition. Children with strong Hindi don't learn English more slowly — they learn it more deeply, with a richer conceptual base to map new vocabulary onto.</p>

<p>This means that investing in Hindi stories during the ages of 2–8 isn't a trade-off against English development. It's the foundation that makes English richer too.</p>

<h2>Making it practical</h2>

<p>The main barrier has always been content. Hindi books for children are harder to find in the right age-range. Hindi audiobooks are scarcer. Hindi digital content is still catching up.</p>

<p>This is exactly why we built Hindi narration into Lalli Fafa from day one, not as an afterthought. A story about your child, told in clear, warm, native-quality Hindi — about the adventures they go on with Lalli and Fafa — is the kind of content that used to require a grandparent in the room.</p>

<p>That grandparent is irreplaceable. But when they're not there, a story in the right language is the next best thing.</p>
    `,
  },
  {
    slug: "how-we-use-ai-to-create-stories-that-feel-human",
    title: "How we use AI to create stories that feel human",
    excerpt:
      "AI-generated children's stories could easily feel mechanical and hollow. Here's how we think about the problem — and what we do to make sure Lalli Fafa stories feel genuinely warm.",
    tag: "Behind the Scenes",
    tagColor: "#ff6b35",
    date: "2 Mar 2025",
    readTime: "7 min read",
    emoji: "🤖",
    image: "/lf-scene-planets.png",
    imgPosition: "center 30%",
    content: `
<p>The first time we generated a children's story using AI, we were genuinely impressed — and a little unsettled. The story was technically correct. The sentences were clean. The moral was clear. And it felt completely hollow.</p>

<p>If you've ever read an AI-generated children's book, you may know the feeling. Something is off. The warmth is performed rather than felt. The characters have names but not personalities. The lesson is stated rather than discovered.</p>

<p>We knew that building Lalli Fafa well meant solving this problem, not working around it.</p>

<h2>The "what" and the "how"</h2>

<p>The fundamental challenge with AI storytelling for children isn't the "what" — AI can generate plot structures, character arcs, and moral resolutions reliably well. The challenge is the "how": the specific texture of language that makes a story feel warm, the precise moment a character makes a choice that feels true, the detail that makes a child laugh or lean in.</p>

<p>Most AI children's stories get the "what" right and completely miss the "how." They tell you a character was brave without showing you the moment bravery felt hard. They resolve the conflict without the genuine messiness that makes resolution satisfying.</p>

<h2>What we did about it</h2>

<p>We spent months doing something unglamorous: reading. Children's books. Thousands of them — the classics, the overlooked, the translated-from-other-languages gems. We paid attention not to what happened in the stories, but how it was said.</p>

<p>A few patterns emerged that we built directly into how our system generates stories:</p>

<h3>Specificity over generality</h3>
<p>"The forest was beautiful" is generic. "The forest smelled like rain and the bark of the old neem tree that Rohan always touched on the way to school" is specific. Specificity is what makes fiction feel real. We train our system to reach for the particular detail rather than the broad stroke.</p>

<h3>Conflict before comfort</h3>
<p>A story with no resistance is not a story — it's a sequence of events. Good children's stories, even very short ones, give the child-protagonist a real moment of difficulty before the resolution. Not trauma, but a genuine "what do I do now?" moment that the character has to navigate. This is what makes the ending earned rather than given.</p>

<h3>Show the feeling, name it second</h3>
<p>The weakest AI stories tell emotions: "Priya felt scared." The best children's authors show them first — "Priya's stomach felt like it was full of butterflies doing somersaults" — and only then (if at all) name the emotion. We've baked this principle into our generation logic explicitly.</p>

<h3>Language calibrated to age, not dumbed down</h3>
<p>There's a difference between age-appropriate language and condescending language. Children's books don't need to avoid interesting words — in fact, a single, perfectly-placed unfamiliar word, explained by context, is one of the most effective vocabulary-building tools that exists. Our stories are calibrated to reading age without being stripped of richness.</p>

<h2>The personalisation layer</h2>

<p>Here's where the warmth really comes from: knowing your child. When Lalli Fafa generates a story for a six-year-old named Ishaan who loves dinosaurs and whose favourite colour is green, the story isn't generated with those as surface decorations. They're woven into the story's logic. Ishaan's dinosaur expertise becomes the thing that saves the day. The green detail appears at the moment it matters most — not sprinkled randomly.</p>

<p>This is the difference between personalisation that feels like mail-merge and personalisation that feels like someone wrote this for your child specifically.</p>

<h2>What AI genuinely can't do — and what we do about it</h2>

<p>We're honest with ourselves about this. AI cannot replicate the specific warmth of a parent's voice reading a story. It cannot know that your child is afraid of thunder right now, or that they just had a hard day at school, or that the character named "Rohan" should be gentle and funny because that's what your child needs to see in a hero this week.</p>

<p>What it can do is give you a beautifully crafted, uniquely personalised story in two minutes — one that you then read to your child in your voice, with your warmth, at your pace. The AI is not the storyteller. You are. The AI is the writer who had a wonderful idea.</p>

<p>That's a collaboration we feel good about.</p>
    `,
  },
  {
    slug: "teaching-kindness-through-storytelling",
    title: "Teaching kindness through storytelling — it really works",
    excerpt:
      "Telling a child to 'be kind' rarely changes behaviour. But a story where a character chooses kindness — and feels the difference it makes — can rewire how a child responds to the world.",
    tag: "Values & Learning",
    tagColor: "#e84040",
    date: "18 Feb 2025",
    readTime: "5 min read",
    emoji: "💛",
    image: "/lf-scene-puppy.png",
    imgPosition: "center 30%",
    content: `
<p>"Be kind." It's the instruction we give most and the one that changes behaviour least. Children hear it dozens of times a week — from parents, teachers, older siblings — and it seems to slide straight off.</p>

<p>This isn't because children are unkind by nature. It's because "be kind" is an abstract instruction delivered in a moment of conflict, when the brain is least receptive to abstract reasoning. You're essentially asking a child's prefrontal cortex — which isn't fully developed until their mid-twenties — to override an immediate emotional impulse using a concept they've been told but haven't felt.</p>

<p>Stories work on a completely different mechanism. And the research on why is fascinating.</p>

<h2>Narrative transportation and moral development</h2>

<p>Psychologists use the term "narrative transportation" to describe what happens when a reader or listener becomes absorbed in a story. Heart rate changes. Time distorts. The brain begins processing the fictional events as if they were real experiences.</p>

<p>For children, who have more permeable boundaries between imagination and reality than adults, this effect is especially pronounced. When a child is transported into a story, they don't just observe a character being kind — they inhabit the experience of kindness. They feel, vicariously, what it is to share something precious with a stranger, to stand up for someone who can't stand up for themselves, to choose honesty when a lie would be easier.</p>

<p>This vicarious experience creates something that direct instruction cannot: an emotional memory. And emotional memories shape behaviour far more powerfully than rules do.</p>

<h2>Why the character matters</h2>

<p>The most effective prosocial stories for children aren't ones where the kind character is a saint. They're ones where the character is tempted not to be kind — where kindness costs something — and chooses it anyway.</p>

<p>The moment of choice is everything. A child who watches (or hears) a character decide to share their last biscuit even though they were hungry doesn't just learn "sharing is good." They experience the internal struggle, the decision, and the warm resolution that follows. That complete emotional arc is what sticks.</p>

<p>This is why the lesson in a Lalli Fafa story is never stated at the beginning or hammered home at the end. It lives in the middle — in the moment of choice — and the ending simply lets the child feel what that choice led to.</p>

<h2>Personalised kindness stories hit harder</h2>

<p>Here's where the research gets particularly interesting for personalised storytelling. When the protagonist of the story shares the child's name, age, and personal characteristics, the narrative transportation effect is amplified. The child isn't just empathising with a character — they are the character. The moral stakes feel higher. The choice feels like their choice.</p>

<p>We've seen this in feedback from parents. Children who hear personalised kindness stories start applying the lesson not as a rule ("I should share") but as an identity ("I'm the kind of person who shares"). The shift from rule-following to identity-based behaviour is one of the most significant transitions in moral development — and stories accelerate it.</p>

<h2>Ages and appropriate lessons</h2>

<p><strong>Ages 2–3:</strong> Kindness stories work best with simple, observable acts — sharing a toy, being gentle with an animal. Abstract kindness (defending someone's feelings) is too conceptually complex. Make it physical and immediate.</p>

<p><strong>Ages 4–6:</strong> This is when empathy begins developing robustly. Stories about characters noticing that a friend feels left out — and doing something about it — are enormously effective at this age. The child is developmentally ready to understand that other people have inner lives different from their own.</p>

<p><strong>Ages 7–8:</strong> Moral complexity becomes possible. Stories where kindness requires courage, or where the kind choice is unpopular, resonate deeply. These children are beginning to navigate peer pressure and appreciate stories that model integrity over approval.</p>

<h2>What to say after the story</h2>

<p>The most underrated parenting move: after a kindness story, don't lecture. Ask one question. "What do you think Priya was feeling when she decided to share?" or "Would it have been hard to make that choice?" Let the child process out loud. That conversation is worth ten "be kind" instructions.</p>

<p>The story did the heavy lifting. Your job is to hold the space for your child to discover what it means — for themselves, in their own words.</p>
    `,
  },
  {
    slug: "science-behind-audio-stories-and-childrens-memory",
    title: "The science behind audio stories and children's memory",
    excerpt:
      "Children remember stories they've heard far better than stories they've read or watched. The neuroscience of why is surprising — and has real implications for how we should use screen time.",
    tag: "Research",
    tagColor: "#2979ff",
    date: "5 Feb 2025",
    readTime: "6 min read",
    emoji: "🎧",
    image: "/lf-scene-orchard.png",
    imgPosition: "center 25%",
    content: `
<p>In a study at Princeton University, researchers scanned the brains of speakers telling stories and listeners hearing those same stories. What they found was remarkable: the brain patterns of the listeners began to mirror those of the speaker — a phenomenon they called "neural coupling." The more tightly coupled the brains, the better the listener comprehended and remembered the story.</p>

<p>This coupling effect is dramatically stronger with audio than with text. And for children, whose visual and reading processing systems are still developing, it may be strongest of all.</p>

<h2>Why audio creates stronger memories</h2>

<p>The human auditory system is ancient. Long before writing existed, storytelling was entirely oral — and our brains evolved to process narrative through sound with extraordinary efficiency. The neural pathways for hearing, understanding, and remembering spoken language are among the most deeply established in the brain.</p>

<p>When a child listens to a story, several things happen simultaneously:</p>

<ul>
  <li>The auditory cortex processes the sounds</li>
  <li>The language centres construct meaning</li>
  <li>The hippocampus (the brain's memory filing system) encodes the narrative as an episodic memory</li>
  <li>The limbic system assigns emotional weight, which determines how strongly the memory is stored</li>
</ul>

<p>This parallel processing creates what memory researchers call "elaborative encoding" — the story is remembered not just as information but as an experience. This is why you can recall the plot of a story you heard as a five-year-old in vivid detail, but struggle to remember what you read in a magazine last week.</p>

<h2>Audio vs. video: a surprising finding</h2>

<p>Many parents assume that video is superior to audio for children's content — more engaging, more information-rich, more stimulating. The research on memory formation tells a different story.</p>

<p>Studies comparing audio stories to video stories in children aged 3–8 consistently find that audio produces better story comprehension and retention. The proposed mechanism is counterintuitive: because audio provides less information, the child's brain has to do more work — constructing images, imagining voices, picturing settings. That active construction is, itself, a memory-formation process.</p>

<p>Video does the imagining for you. Audio makes you imagine. And when you've imagined something, you own it in a way you don't when it's been shown to you.</p>

<h2>The imagination advantage</h2>

<p>This connects to a broader finding in developmental psychology: imaginative engagement, when measured by what's called "mental imagery vividness," is strongly associated with vocabulary development, creative thinking, and — fascinatingly — emotional intelligence.</p>

<p>Children who regularly listen to audio stories show enhanced ability to take perspective (imagining how someone else sees a situation), which is the cognitive foundation of empathy. They also show expanded vocabulary — not just knowing more words, but understanding words in context, which is a deeper kind of word knowledge than flashcard learning provides.</p>

<h2>Voice quality and the parent effect</h2>

<p>One of the most consistent findings in the research is the primacy of familiar voice. Children's memory and comprehension improve significantly when they hear stories in a voice they know and trust — ideally a parent's or grandparent's.</p>

<p>The neural explanation involves oxytocin: hearing a familiar loved voice triggers the same bonding hormone that mother-infant eye contact does. This creates a learning state that is simultaneously calm and highly alert — optimal for both emotional processing and memory formation.</p>

<p>For narrated story apps, this has a practical implication: the most valuable use of audio stories isn't as a replacement for parental reading, but as a supplement — content that parents then discuss with their children, providing that familiar-voice layer of processing.</p>

<h2>What this means for screen time conversations</h2>

<p>If you're trying to reduce screen time for your child without reducing enrichment, audio stories are the most evidence-backed alternative. They provide:</p>

<ul>
  <li>Higher memory retention than video</li>
  <li>Greater vocabulary development than reading alone (for pre-reading children)</li>
  <li>Stronger imaginative activation than any visual medium</li>
  <li>Better sleep preparation than screens (no blue light, no visual stimulation)</li>
</ul>

<p>The research is particularly strong for the 20–30 minutes before bed — the exact window where most screen-time battles happen. An audio story in that window doesn't just avoid the downsides of screens; it actively prepares the brain for sleep by activating the calm, imaginative, narrative-processing mode that is closest to the dreaming state.</p>

<p>Your child's brain was built for this. It has been, for hundreds of thousands of years.</p>
    `,
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getFeaturedPost(): BlogPost {
  return BLOG_POSTS.find((p) => p.featured) ?? BLOG_POSTS[0];
}

export function getRecentPosts(excludeSlug?: string, limit = 3): BlogPost[] {
  return BLOG_POSTS.filter((p) => p.slug !== excludeSlug).slice(0, limit);
}
