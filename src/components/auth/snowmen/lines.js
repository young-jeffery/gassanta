// Everything the snowmen say. Each key is an event name; AuthShell's say(event, data) picks a random line from the
// list (never the same one twice in a row). {placeholders} are filled from `data`. Keep lines short: they appear in
// small speech bubbles. Some are jokes, some are real tips about the field you're on.

const LINES = {
  hello: [
    "Hi there! Fill in the form and we'll keep an eye on you. Not creepy. Promise.",
    "Welcome! Don't mind us, we're just standing around. It's what we do.",
  ],
  idle: [
    "Fun fact: I'm 100% organic and 0% heated.",
    "I'd wave, but, you know, sticks.",
    "Is it just me or is it getting warm in here?",
    "Take your time. We're not going anywhere. No legs.",
    "My nose is a carrot. No, you can't have it.",
    "I've been told I'm a cool guy. Often.",
    "If I melt, tell my story. Or at least tell Santa.",
    "Psst. The gift gacha is going to be good this year.",
    "**sigh** Oh me? My snowchild starts snowschool next week. I'm nervous.",
    "What do snowmen call their kids? Chill-dren. Ha! I'm so funny.",
    "I have a snowball collection. It's a bit of a snowball effect.",
    "Why don't snowmen ever get married? Because they have cold feet. Ka Ba Ba Ba Ba Ba.",
    "Never fight off an attacking snowman with a stick — you'll only arm your attacker.",
    "If you haven't laughed at any of my jokes yet then you should take my place. Cause you're cold hearted. Hah!",
    "I left my last snowman gig. My boss was a little bit hot headed. Hehe.",
  ],
  poke: [
    "Hey! Cold hands!",
    "Boop received.",
    "Careful, I'm fluffy.",
    "That tickles. In a chilly way.",
    "Do that again and I'll melt. Dramatically.",
    "Rude. But also, again?",
    "Did you just touch me? When last did you wash your hands? Ew.",
    "If I was a snowwoman, I'd have taken you to court and sued you for sexual harassment. But I'm a snowman, so I can't.",

  ],

  // ---- join code
  "focus:code": [
    "Got your invite code? It's the 8 characters your organiser sent you.",
    "Paste it in. Nobody's judging.",
  ],
  "code:ok": ["Found {group}! Good company in there.", "{group}! Great choice."],
  "code:bad": [
    "Hmm, that code didn't work. Check for typos, or ask your organiser.",
    "No group answers to that code. Try once more?",
  ],
  "code:closed": ["Doors are closed for now. Sorry!", "{group} isn't taking new people right now."],

  // ---- details
  "focus:realName": [
    "Your real name stays private. Only the group admins can see it.",
    "Full name here. The cool nickname comes next.",
  ],
  "focus:nickname": [
    "This is your reveal name, so make it fun. Everyone will see it.",
    "Pick something memorable. \"Santa's Favourite\" is probably taken.",
  ],
  "nickname:free": ["{name}? Love it. It's yours!", "{name} is free. Grab it!"],
  "nickname:taken": ["Someone already took {name}. Add a twist?", "{name} is taken. Be more original than that!"],
  "focus:email": [
    "A real email, please. We'll write when each phase opens.",
    "Dots and plus-signs in your address are fine.",
  ],
  "email:typo": ["Did you mean {suggestion}? Tap the suggestion under the field.", "That looks like a typo. {suggestion}?"],
  "focus:confirmEmail": [
    "Type it once more, so we know the first one wasn't a sneeze.",
    "Same email again. Pasting is allowed.",
  ],
  "email:mismatch": ["These two emails don't match. Typo hiding somewhere?"],
  "email:match": ["Emails match. Nicely done."],
  "focus:password": [
    "8 or more characters. Mix it up, like snowflakes: no two alike.",
    "Don't use \"password123\". I will judge you.",
  ],
  "password:weak": ["A bit short. 8 characters or more, please."],
  "password:ok": ["Strong enough for a blizzard!", "Now that's a sturdy password."],
  "focus:confirmPassword": ["Once more, with feeling!", "Type it again so we know you meant it."],
  "password:mismatch": ["Those passwords aren't twins. Try again."],
  "password:match": ["Matching. Chef's kiss."],
  "reveal:on": ["I'm not looking! La la la.", "Eyes elsewhere. Promise.", "Nothing to see here. Literally, I'm looking at the sky."],
  "reveal:off": ["Back to watching you. Kindly."],

  // ---- login
  "focus:loginEmail": ["Welcome back! Which email did you sign up with?", "Oh, it's you! Which email was it?"],
  "focus:loginPassword": [
    "I'm not peeking. Tap Show if you want to double-check it yourself.",
    "Forgot it? There's a link right below.",
  ],
  "login:submit": ["Checking the list... and checking it twice!", "One moment, consulting the nice list."],
  "login:error": ["Hmm, that didn't match. Check both fields.", "Not quite. Wrong email or password?"],

  // ---- steps on phones
  "step:2": ["Halfway there! Now the email, so we can keep you posted.", "Nice. Next up: your email."],
  "step:3": ["Last step! Make the password a good one.", "Final stretch. Almost a Secret Santa!"],

  // ---- trolling: things people do that deserve a comment
  "code:bad3": [
    "Three wrong codes. Are you guessing? Ask your organiser, I'm begging you.",
    "Third time unlucky! Maybe the code is sitting in your WhatsApp?",
  ],
  "code:bad5": [
    "At this point you're just typing for fun, aren't you?",
    "At least five tries. Even I'm embarrassed for us. Message your organiser!",
  ],
  "login:error2": ["Twice now? Is Caps Lock on? Santa checks these things.", "Two strikes it seems. Tap Show and look at what you typed."],
  "login:error4": ["Fourth time was not the charm. Maybe 'Forgot your password?' is the move?", "I'd offer a hint, but I actually don't care. It's above my pay grade"],
  "login:empty": ["Bold strategy: logging in with nothing.", "Tell me your email first. I can't read minds. No brain."],
  "login:empty2": ["Empty again! The form is not psychic either."],
  "poke:5": ["Okay, okay! I felt that five times.", "Poke me again and I'm telling Santa."],
  "poke:10": ["Ten pokes?! I'm filing a complaint with the North Pole.", "You're relentless. I respect it."],
  "nickname:taken3": ["Three taken nicknames. Everyone has your taste, huh?", "Try adding a number. Or a fruit."],
  "nickname:santa": ["There's only one Santa, and he's busy. Pick another?", "Santa? Bold. He'd want royalties."],
  "nickname:grinch": ["The Grinch? In THIS group? Ha!", "A Grinch in a Secret Santa. Plot twist."],
  "nickname:admin": ["Nice try. Admins are made, not typed."],
  "nickname:god": ["God Abeg already has a group named after it. Try something humbler."],
  "invalid3": ["Third time the form says no. Read the red bits, my friend.", "The red text isn't decoration, you know."],
  "email:mismatch3": ["Three mismatched emails. Copy the first and paste it, it's allowed."],
  "password:mismatch3": ["Your two passwords are in a fight. Tap Show and referee.", "Passwords still don't match. Tap Show and compare."],
  "password:common": [
    "That password is on every hacker's list. Even I know it.",
    "'password123'? Santa would not approve.",
  ],
  "reveal:flip": ["Show, hide, show, hide... make up your mind!", "I keep ducking and looking. I'm getting dizzy."],

  // ---- outcomes
  submit: ["Sending you in. Hold on to your scarf!", "Off we go..."],
  success: ["Welcome aboard, {name}! Ho ho ho!", "You're in, {name}! Time to celebrate."],
  error: ["Ouch, something snagged. Read the message, then try again.", "That didn't work. Check the red text."],
  invalid: ["Almost! A few fields need another look.", "A couple of things to fix first."],
};

// Repeats of the same event within windowMs are counted. When the count reaches a step's `at`, that step's event is
// said instead (and again every second repeat after the last step). Counts reset after the window or on success.
export const ESCALATE = {
  "code:bad": { windowMs: 90000, steps: [{ at: 3, event: "code:bad3" }, { at: 5, event: "code:bad5" }] },
  "login:error": { windowMs: 120000, steps: [{ at: 2, event: "login:error2" }, { at: 4, event: "login:error4" }] },
  "login:empty": { windowMs: 60000, steps: [{ at: 2, event: "login:empty2" }] },
  poke: { windowMs: 5000, steps: [{ at: 5, event: "poke:5" }, { at: 10, event: "poke:10" }] },
  "nickname:taken": { windowMs: 90000, steps: [{ at: 3, event: "nickname:taken3" }] },
  invalid: { windowMs: 60000, steps: [{ at: 3, event: "invalid3" }] },
  "email:mismatch": { windowMs: 90000, steps: [{ at: 3, event: "email:mismatch3" }] },
  "password:mismatch": { windowMs: 90000, steps: [{ at: 3, event: "password:mismatch3" }] },
  "reveal:on": { windowMs: 40000, steps: [{ at: 4, event: "reveal:flip" }] },
};

// Minimum milliseconds before the SAME event may speak again (default 6000). Pokes can come fast.
export const LINE_GAP = { poke: 700, "poke:5": 800, "poke:10": 800, "code:bad3": 500, "code:bad5": 500, "login:error2": 500, "login:error4": 500, "login:empty2": 500, "nickname:taken3": 500, invalid3: 500, "password:mismatch3": 500, "email:mismatch3": 500, "reveal:flip": 500, idle: 12000, hello: 60000, "nickname:free": 2500, "nickname:taken": 2500, "code:bad": 2000 };

const lastByEvent = {};

export function pickLine(event, data = {}) {
  const pool = LINES[event];
  if (!pool || pool.length === 0) return null;
  let line = pool[Math.floor(Math.random() * pool.length)];
  if (pool.length > 1 && line === lastByEvent[event]) line = pool[(pool.indexOf(line) + 1) % pool.length];
  lastByEvent[event] = line;
  return line.replace(/\{(\w+)\}/g, (_, key) => String(data[key] ?? "").trim());
}
