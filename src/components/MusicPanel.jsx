import { useMusic } from "../audio/useMusic";
import { useSfx } from "../audio/useSfx";
import { sfx } from "../audio/sfx";
import { NextIcon, PauseIcon, PlayIcon, PrevIcon } from "./Icons";

// Now-playing controls + track list + the sound-effects switch.
export default function MusicPanel() {
  const { tracks, index, current, playing, error, toggle, next, prev, select } = useMusic();
  const { muted, setMuted } = useSfx();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-ink/5 p-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-muted">{playing ? "Now playing" : "Paused"}</p>
          <p className="truncate font-display text-lg font-extrabold text-ink">{current.title}</p>
          {current.credit && <p className="truncate text-xs text-muted">{current.credit}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button onClick={prev} aria-label="Previous track" className="rounded-full p-2 text-ink active:scale-90">
            <PrevIcon />
          </button>
          <button
            onClick={toggle}
            aria-label={playing ? "Pause" : "Play"}
            className="rounded-full bg-primary p-3 text-on-primary shadow-lg active:scale-90"
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button onClick={next} aria-label="Next track" className="rounded-full p-2 text-ink active:scale-90">
            <NextIcon />
          </button>
        </div>
      </div>

      {/* Sound effects: chimes and taps. Separate from the music, saved on this device. */}
      <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-ink/5 p-4">
        <div className="min-w-0">
          <p className="font-display text-base font-extrabold text-ink">Sound effects</p>
          <p className="text-xs text-muted">Chimes and taps when you play with the scene</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={!muted}
          aria-label="Sound effects"
          onClick={() => {
            const turningOn = muted;
            setMuted(!muted);
            if (turningOn) sfx.preview();
          }}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${muted ? "bg-ink/20" : "bg-primary"}`}
        >
          <span
            className={`absolute left-1 top-1 h-5 w-5 rounded-full transition-transform ${muted ? "bg-ink/70" : "translate-x-5 bg-on-primary"}`}
          />
        </button>
      </div>

      {error && (
        <p className="mb-3 rounded-xl bg-primary/20 p-3 text-sm text-ink">
          Couldn&apos;t load this track. Check that the mp3 exists in <code>public/audio</code> and the path in{" "}
          <code>src/audio/tracks.js</code> matches.
        </p>
      )}

      <ul className="flex flex-col gap-1">
        {tracks.map((t, i) => (
          <li key={t.id}>
            <button
              onClick={() => select(i)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition active:scale-[0.98] ${
                i === index ? "bg-ink/10 font-bold text-ink" : "text-muted hover:bg-ink/5"
              }`}
            >
              <span className="w-5 text-center text-xs">{i === index && playing ? "♪" : i + 1}</span>
              <span className="truncate">{t.title}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
