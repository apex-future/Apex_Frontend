/**
 * Greeting messages organized by signal type.
 * Each message has:
 *   - greeting: identity + time/context line
 *   - talk: one line about what to do with this moment
 *
 * Placeholder "X" in strings is replaced dynamically with the relevant number
 * (streak days, days to exam, etc.)
 */

export const greetingMessages = {
  morning: [
    { greeting: 'Good morning, {name}.', talk: 'The day is yours — open a book first.' },
    { greeting: 'The scholar is up, good morning.', talk: 'Start strong before the world gets loud.' },
    { greeting: 'Morning, {name}.', talk: 'One session and the day already wins.' },
    { greeting: 'Good morning, scholar.', talk: 'Your books have been waiting.' },
    { greeting: 'Rise and study, {name}.', talk: 'Today is another chance to be great.' },
  ],

  afternoon: [
    { greeting: 'Good afternoon, {name}.', talk: 'Still time to make today count.' },
    { greeting: 'The scholar checks in, good afternoon.', talk: 'Pick up where you left off.' },
    { greeting: 'Good afternoon, {name}.', talk: "The grind doesn't take lunch breaks." },
    { greeting: 'Afternoon, scholar.', talk: 'One session is all it takes.' },
    { greeting: 'Good afternoon, {name}.', talk: "The day isn't done yet." },
  ],

  evening: [
    { greeting: 'Evening, {name}.', talk: 'End the day with something.' },
    { greeting: 'Good evening, scholar.', talk: 'One last push before you rest.' },
    { greeting: 'Evening, {name}.', talk: "Don't let today close without a session." },
    { greeting: 'The day is winding down, {name}.', talk: 'Make the last hour count.' },
    { greeting: 'Good evening, scholar.', talk: 'Finish strong — future {name} will thank you.' },
  ],

  streak: [
    { greeting: 'X days strong, {name}.', talk: "Don't break what you're building." },
    { greeting: 'The streak lives, scholar.', talk: 'Feed it before the day ends.' },
    { greeting: 'X days and still showing up, {name}.', talk: 'Keep the pace.' },
    { greeting: 'Consistency looks good on you, scholar.', talk: 'One more today.' },
    { greeting: 'X days, {name}.', talk: "Scholars don't stop here." },
  ],

  examClose: [
    { greeting: 'E is X days away, scholar.', talk: 'This is the window. Use it.' },
    { greeting: 'X days left, {name}.', talk: 'No wasted sessions from here.' },
    { greeting: 'The big day is close, scholar.', talk: 'Everything counts now.' },
    { greeting: 'X days, {name}.', talk: "You've come too far to coast now." },
    { greeting: 'Almost there, scholar.', talk: "Lock in — this is what the work was for." },
  ],

  longAbsence: [
    { greeting: '{name} the scholar returns.', talk: 'Pick up where you left off.' },
    { greeting: 'We kept your books warm, scholar.', talk: 'Welcome back.' },
    { greeting: 'The grind missed you, {name}.', talk: 'No judgment — just start.' },
    { greeting: "You're back, scholar.", talk: "That's what matters." },
    { greeting: 'Good to see you, {name}.', talk: 'Your study space is ready.' },
  ],
};
