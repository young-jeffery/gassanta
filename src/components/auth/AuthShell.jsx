import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { StageContext } from "./stageContext";
import { createGazeStore } from "./snowmen/gazeStore";
import { ESCALATE, LINE_GAP, pickLine } from "./snowmen/lines";
import SnowmanScene from "./snowmen/SnowmanScene";
import PeekingSnowman from "./snowmen/PeekingSnowman";
import Bubble from "./snowmen/Bubble";

// Page frame for register / join / login.
//   Desktop (md and up): the whole page width is split in half. One half is the form card, the other is a stage with
//     three snowmen. `side` says which half holds the form (register: "right", login: "left").
//   Phone: just the form, with one snowman peeking over the top edge of the card.
//   Phone in landscape (short:): just the form, no snowmen.
// The snowmen watch the mouse, then the form field you are using; look away while a password is visible; and say
// things (bubbles). Fields and pages talk to them through useStage() (see useStage.js).

// Where each bubble sits above its snowman, as a percentage of the desktop stage (640x600 drawing, see SnowmanScene)
const SPOTS = [
  { left: "26.5%", top: "19.5%" },
  { left: "56.3%", top: "39%" },
  { left: "81%", top: "54%" },
];

// Palette-driven snowman colours (white-ish bodies, soft outline, shadow, snow bank)
const STAGE_VARS = {
  "--sm-body": "color-mix(in srgb, var(--c-snow) 78%, #ffffff)",
  "--sm-line": "color-mix(in srgb, var(--c-ink) 42%, transparent)",
  "--sm-shadow": "color-mix(in srgb, var(--c-canvas) 55%, transparent)",
  "--sm-ground": "color-mix(in srgb, var(--c-snow) 90%, var(--c-canvas))",
};

// Where in the viewport a form field's "caret" is, so the snowmen can follow typing
function caretPoint(el) {
  const r = el.getBoundingClientRect();
  const typed = typeof el.value === "string" ? el.value.length : 0;
  return { x: r.left + Math.min(r.width - 18, 18 + typed * 8.5), y: r.top + r.height / 2 };
}

export default function AuthShell({ side = "right", title, subtitle, footer, children }) {
  const { status } = useAuth();
  const [gaze] = useState(createGazeStore);
  const [speech, setSpeech] = useState(null); // { id, text, who: 0 | 1 | 2 }
  const [revealed, setRevealedState] = useState(false);
  const [cheerCount, setCheerCount] = useState(0);

  const lastSaid = useRef({});
  const tallies = useRef({});
  const counter = useRef(0);
  const lastWho = useRef(-1);
  const lastActivity = useRef(0);
  const wasRevealed = useRef(false);
  const timers = useRef({ hide: 0, hello: 0, idle: 0 });

  const awayDir = side === "right" ? -1 : 1; // look away from the form

  // say(event, data, who): `who` (0-2) picks which snowman speaks; leave it out for a random one.
  const say = useCallback((event, data, who) => {
    const now = performance.now();

    // Count repeats of this event; at certain counts a snowman trolls instead (see ESCALATE in lines.js)
    let key = event;
    const rule = ESCALATE[event];
    if (rule) {
      const t = tallies.current[event] ?? { n: 0, at: -1e9 };
      t.n = now - t.at > rule.windowMs ? 1 : t.n + 1;
      t.at = now;
      tallies.current[event] = t;
      const hit = [...rule.steps].reverse().find((step) => t.n >= step.at);
      const last = rule.steps[rule.steps.length - 1];
      if (hit && (t.n === hit.at || (hit === last && (t.n - hit.at) % 2 === 0))) key = hit.event;
    }
    if (event === "success") tallies.current = {};

    if (now - (lastSaid.current[key] ?? -1e9) < (LINE_GAP[key] ?? 6000)) return;
    const text = pickLine(key, data);
    if (!text) return;
    lastSaid.current[key] = now;

    let speaker = who ?? Math.floor(Math.random() * 3);
    if (who === undefined && speaker === lastWho.current) speaker = (speaker + 1) % 3;
    lastWho.current = speaker;
    counter.current += 1;
    setSpeech({ id: counter.current, text, who: speaker });
    window.clearTimeout(timers.current.hide);
    timers.current.hide = window.setTimeout(() => setSpeech(null), 3400 + text.length * 70);
  }, []);

  const stage = useMemo(
    () => ({
      say,
      focusField(key, el) {
        lastActivity.current = performance.now();
        const p = caretPoint(el);
        gaze.field(p.x, p.y);
        say(`focus:${key}`);
      },
      typeField(key, el) {
        lastActivity.current = performance.now();
        const p = caretPoint(el);
        gaze.field(p.x, p.y);
      },
      blurField() {
        gaze.clearField();
      },
      setRevealed(on) {
        if (wasRevealed.current === on) return;
        wasRevealed.current = on;
        setRevealedState(on);
        gaze.away(on, awayDir);
        say(on ? "reveal:on" : "reveal:off");
      },
      cheer() {
        setCheerCount((n) => n + 1);
      },
    }),
    [say, gaze, awayDir]
  );

  // The mouse (or a tap) tells the snowmen where to look (also in lite mode: it costs next to nothing)
  useEffect(() => {
    const move = (e) => {
      if (e.pointerType !== "touch") gaze.pointer(e.clientX, e.clientY);
    };
    const down = (e) => gaze.pointer(e.clientX, e.clientY, true);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
    };
  }, [gaze]);

  // A greeting, then an occasional joke while nobody is typing
  useEffect(() => {
    const t = timers.current;
    t.hello = window.setTimeout(() => {
      if (counter.current === 0) say("hello"); // not if a snowman already had something to say
    }, 1400);
    const loop = () => {
      t.idle = window.setTimeout(() => {
        if (document.visibilityState === "visible" && performance.now() - lastActivity.current > 9000) say("idle");
        loop();
      }, 15000 + Math.random() * 12000);
    };
    loop();
    return () => {
      window.clearTimeout(t.hello);
      window.clearTimeout(t.idle);
      window.clearTimeout(t.hide);
    };
  }, [say]);

  // The snowman that was poked is the one who answers (the phone's single snowman passes nothing)
  const onPoke = useCallback((who) => say("poke", undefined, who), [say]);
  // When the form is on the left the snowmen are on the right and mirrored (see SnowmanScene), so are their bubbles
  const mirror = side === "left";
  const spot = speech ? { left: mirror ? `${100 - parseFloat(SPOTS[speech.who].left)}%` : SPOTS[speech.who].left, top: SPOTS[speech.who].top } : null;
  // Always a way out: signed-in people go back to their dashboard, everyone else to the start page
  const back = status === "signedIn" ? { to: "/dashboard", label: "Back to dashboard" } : { to: "/", label: "Back to home" };
  const order = side === "right" ? ["md:order-1", "md:order-2"] : ["md:order-2", "md:order-1"]; // [stage, form]

  return (
    <StageContext.Provider value={stage}>
      {/* Desktop: break out of the page's 80% content width so the two halves span the whole window */}
      <section className="flex flex-1 flex-col md:ml-[calc(50%-50vw)] md:w-screen md:flex-row" style={STAGE_VARS}>
        <div className={`flex flex-1 flex-col justify-center md:w-1/2 md:flex-none md:px-[4vw] short:w-full ${order[1]}`}>
          <div className="mx-auto flex w-full max-w-md flex-col py-6">
            <Link
              to={back.to}
              className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full border border-accent/40 bg-surface/80 px-3.5 py-1.5 text-sm font-bold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <span aria-hidden="true">&larr;</span> {back.label}
            </Link>
            <div className="relative h-36 md:hidden short:hidden">
              <PeekingSnowman store={gaze} hidden={revealed} speech={speech} onPoke={onPoke} />
              {speech && (
                <Bubble
                  key={speech.id}
                  text={speech.text}
                  className="absolute right-2 bottom-9 left-33 text-sm"
                  tailClass="left-5"
                />
              )}
            </div>
            <div className="rounded-3xl border border-accent/30 bg-surface/90 p-5 shadow-xl md:p-7">
              {title && <h1 className="font-display text-3xl font-extrabold text-ink md:text-4xl">{title}</h1>}
              {subtitle && <p className="mt-1 mb-4 text-sm text-muted">{subtitle}</p>}
              {children}
            </div>
            {footer && <div className="mt-4 px-1 text-center text-sm text-ink/90 md:text-left">{footer}</div>}
          </div>
        </div>

        <div aria-hidden="true" className={`hidden md:block md:w-1/2 short:hidden ${order[0]}`}>
          {/* sticky: the snowmen stay on screen while a long form scrolls */}
          <div className="sticky top-0 flex h-svh items-end justify-center">
            <div className="relative" style={{ aspectRatio: "640 / 600", width: "min(100%, calc((100svh - 4rem) * 640 / 600))" }}>
              <SnowmanScene store={gaze} speech={speech} cheer={cheerCount} onPoke={onPoke} mirror={mirror} />
              {speech && (
                <Bubble
                  key={speech.id}
                  text={speech.text}
                  style={{ left: spot.left, top: spot.top }}
                  className="absolute w-max max-w-52 -translate-x-1/2 -translate-y-full text-[0.95rem]"
                />
              )}
            </div>
          </div>
        </div>
      </section>
    </StageContext.Provider>
  );
}
