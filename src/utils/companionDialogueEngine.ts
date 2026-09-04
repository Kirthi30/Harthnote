// Interactive, context-aware dialogue engine for Hearth Companion

export interface CompanionResponse {
  companionReply: string;
  suggestedFollowUps: string[];
  modelUsed: string;
}

export function generateInteractiveCompanionReply(
  userMessage: string,
  history: Array<{ sender: 'ai' | 'user'; text: string }>,
  context: { weekLabel?: string; moodSummary?: string; questions?: string[] }
): CompanionResponse {
  const clean = (userMessage || '').trim();
  const lower = clean.toLowerCase();

  // Determine emotional & topical nuances
  const isQuestion = /(\?|\bwhy\b|\bhow\b|\bwhat\b|\bcan you\b|\bhelp\b|\bexplain\b|\bshould i\b)/i.test(lower);
  const isGratitude = /(thank|appreciate|grateful|kind|love this|helpful|calming|comforting)/i.test(lower);
  const isStressed = /(stress|anxious|overwhelm|tired|exhaust|burnout|drained|panic|pressure|deadline|busy|rush)/i.test(lower);
  const isSad = /(sad|cry|lonely|heartbreak|loss|grief|hurt|pain|hopeless|heavy|hard|struggl)/i.test(lower);
  const isCalmJoy = /(calm|peace|joy|happy|grounded|content|glad|blessed|excited|proud|relieved)/i.test(lower);
  const isNatureRest = /(nature|walk|trees|sun|morning|sky|breathe|tea|coffee|night|sleep|rest|pause|quiet|park)/i.test(lower);
  const isWorkProductivity = /(work|job|boss|meeting|project|code|school|study|career|tasks|office|clients)/i.test(lower);
  const isRelationships = /(friend|family|mom|dad|sister|brother|partner|husband|wife|daughter|son|roommate|relationship|conflict|talk)/i.test(lower);

  let companionReply = '';
  let suggestedFollowUps: string[] = [];

  if (isGratitude) {
    companionReply = "It is truly my pleasure to walk alongside you in this quiet space. Giving yourself permission to pause, write, and reflect is a profound gift of self-care. What part of this week's journey would you like to explore next?";
    suggestedFollowUps = [
      "What was my biggest surprise this week?",
      "How can I carry this sense of ease forward?",
      "Help me write a concluding thought for my week"
    ];
  } else if (isStressed) {
    companionReply = "I hear the weight and tension in what you are holding. When the demands of the week pile up, it is so easy for our inner rhythm to get overwhelmed. You don't have to fix everything in this exact moment. Right now, what is one small thing you can take off your shoulders to catch your breath?";
    suggestedFollowUps = [
      "How can I set better boundaries next week?",
      "Why do I feel like I'm never doing enough?",
      "Guide me through a quick calming breathing pause"
    ];
  } else if (isSad) {
    companionReply = "Thank you for trusting me with that tenderness. It takes real courage to sit with sorrow or difficult feelings rather than burying them. There is no timeline on healing or feeling better. If you look at yourself with the eyes of a close, loving friend, what gentle words would you say to your heart today?";
    suggestedFollowUps = [
      "How do I let go of things outside my control?",
      "What is something small that brought me a little comfort?",
      "Help me be gentler with myself"
    ];
  } else if (isCalmJoy) {
    companionReply = "That radiant clarity comes through so clearly in your words! Those moments of peace and grounding are like gentle seeds—when we notice and cherish them, they take deeper root in our daily life. How did that sense of calm change the way you moved through your days?";
    suggestedFollowUps = [
      "How can I make this positive habit stick?",
      "What sparked this joyful energy for me?",
      "Summarize this feeling into a personal affirmation"
    ];
  } else if (isNatureRest) {
    companionReply = "Connecting with those sensory, unhurried moments—fresh air, morning sunlight, a warm cup, or still silence—is the deepest medicine for a busy mind. Those quiet pauses replenish what daily routines take away. How can you protect a little pocket of that stillness in the upcoming week?";
    suggestedFollowUps = [
      "What daily ritual could I start next week?",
      "How can I slow down when my schedule gets frantic?",
      "Help me describe this peaceful moment in my journal"
    ];
  } else if (isWorkProductivity) {
    companionReply = "Work and deadlines have a way of demanding our full attention, often crowding out the room we need just to be human. Recognizing that friction is the first step toward reclaiming your agency. As you reflect on this week's tasks, what was one accomplishment you should give yourself genuine credit for?";
    suggestedFollowUps = [
      "How can I stop overthinking after work hours?",
      "What boundary would make my workday feel lighter?",
      "Help me celebrate a small win from this week"
    ];
  } else if (isRelationships) {
    companionReply = "Relationships and human connections shape so much of our emotional landscape—both the deep warmth they bring and the delicate tensions they can create. Looking back on those interactions, what felt most meaningful to you, or where did you feel called to honor your own needs?";
    suggestedFollowUps = [
      "How do I balance being there for others with my own needs?",
      "What kind words could I share with someone close to me?",
      "How did this conversation impact my mood?"
    ];
  } else if (isQuestion) {
    companionReply = "That is a thoughtful question to bring to this reflection. When we look beneath the surface of our weekly routines, the answer often isn't about doing more, but about listening closer to what our mind and body are quietly asking for. What does your intuition say when you let the room go silent for a moment?";
    suggestedFollowUps = [
      "What is the underlying theme of my week?",
      "What should I let go of as this week ends?",
      "What is one intention I want to set for next week?"
    ];
  } else if (clean.length < 20) {
    companionReply = "Thank you for sharing that thought with me. Even a brief impression holds a valuable thread of self-understanding. Would you like to expand on what led to that, or explore how that feeling sat with you during the week?";
    suggestedFollowUps = [
      "Tell me more about what happened",
      "How did that make me feel overall?",
      "What should I do with this realization?"
    ];
  } else {
    // Dynamic synthesis based on user's specific words
    const reflectionOpeners = [
      `Hearing you reflect on "${clean.slice(0, 45)}..." reveals a lot about what mattered most to you this week. `,
      "That is a perceptive and honest observation. Putting words to these impressions is how experiences turn into lasting self-clarity. ",
      "Your reflection highlights something very genuine about where your energy flowed these past days. "
    ];
    const pickedOpener = reflectionOpeners[Math.floor(Math.random() * reflectionOpeners.length)];

    companionReply = `${pickedOpener}When you look back on that experience now, does it feel like something you are ready to release, or an insight you want to carry forward into your next chapter?`;
    suggestedFollowUps = [
      "I want to carry this insight forward",
      "I feel ready to let this go and move forward",
      "Help me summarize my main takeaway from this week"
    ];
  }

  return {
    companionReply,
    suggestedFollowUps,
    modelUsed: 'hearthnote-companion-interactive-engine',
  };
}
