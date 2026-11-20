// The snowman drawing. Everything is plain SVG shapes coloured from CSS variables that AuthShell sets from the
// active palette (--sm-body, --sm-line, --sm-shadow), so the snowmen follow every colour theme and day/night.
//
// Local coordinates: origin = centre of the base on the ground, y grows downward, so the snowman is about 250 tall.
// The data-* attributes are hooks for GSAP (idle animation, gaze, poke bounce):
//   data-snow     whole snowman      data-breathe  idle breathing   data-squash  poke squash/jump
//   data-head     head (gaze nudge)  data-eye       eye (blink; gaze measures it)    data-pupil  the moving pupil
//   data-mouth    talking            data-tail      scarf tail sway                  data-arm-r  the waving arm
// Rule used throughout: an element GSAP animates has NO transform attribute of its own; position lives on a parent <g>.

const BODY = { fill: "var(--sm-body)", stroke: "var(--sm-line)", strokeWidth: 2 };
const STICK = { fill: "none", stroke: "#6b4a2b", strokeWidth: 4.5, strokeLinecap: "round" };
const COAL = { fill: "#26262b" };

function Eye({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g data-eye>
        <ellipse rx="7.4" ry="8.2" fill="#fff" stroke="var(--sm-line)" strokeWidth="1.2" />
        <g data-pupil>
          <circle r="3.9" fill="#1c1b1f" />
          <circle cx="1.3" cy="-1.4" r="1.2" fill="#fff" />
        </g>
      </g>
    </g>
  );
}

function Hat({ type, color }) {
  const dark = `color-mix(in srgb, ${color} 62%, #000000)`;
  if (type === "top") {
    return (
      <g>
        <ellipse cy="-27" rx="33" ry="7" fill="#2a2a32" />
        <rect x="-20" y="-62" width="40" height="36" rx="4" fill="#2a2a32" />
        <rect x="-20" y="-38" width="40" height="9" style={{ fill: color }} />
      </g>
    );
  }
  if (type === "beanie") {
    // sits high on the head so the cuff clears the eyes (they reach up to y = -12)
    return (
      <g>
        <path d="M-28 -21 C-28 -53 28 -53 28 -21 Z" style={{ fill: color }} />
        <rect x="-30" y="-27" width="60" height="12" rx="6" style={{ fill: dark }} />
        <circle cy="-50" r="7.5" style={BODY} />
      </g>
    );
  }
  // earmuffs
  return (
    <g>
      <path d="M-31 -6 C-33 -46 33 -46 31 -6" fill="none" stroke="#3a3a44" strokeWidth="5" strokeLinecap="round" />
      <circle cx="-33" cy="2" r="10" style={{ fill: color }} stroke={dark} strokeWidth="1.5" />
      <circle cx="33" cy="2" r="10" style={{ fill: color }} stroke={dark} strokeWidth="1.5" />
    </g>
  );
}

// Origin = centre of the head. `color` is the matching scarf colour, reused for the hat. `facing` = which way the nose points.
export function Head({ hat, color, facing = "right" }) {
  return (
    <g>
      <circle r="32" style={BODY} />
      <ellipse cx="-11" cy="-19" rx="11" ry="6" fill="#fff" opacity="0.35" />
      <circle cx="-21" cy="10" r="5" style={{ fill: "var(--c-primary)" }} opacity="0.28" />
      <circle cx="21" cy="10" r="5" style={{ fill: "var(--c-primary)" }} opacity="0.28" />
      <Eye x={-11} y={-4} />
      <Eye x={11} y={-4} />
      <path d={facing === "left" ? "M2 4 L-26 9 L2 14 Z" : "M-2 4 L26 9 L-2 14 Z"} fill="#f28a1d" stroke="#c76a0c" strokeWidth="1" strokeLinejoin="round" />
      <g data-mouth>
        {[
          [-14, 18],
          [-8, 22],
          [0, 24],
          [8, 22],
          [14, 18],
        ].map(([cx, cy]) => (
          <circle key={cx} cx={cx} cy={cy} r="1.9" style={COAL} />
        ))}
      </g>
      <Hat type={hat} color={color} />
    </g>
  );
}

// Origin = centre of the neck
export function Scarf({ color, facing = "right" }) {
  const dark = `color-mix(in srgb, ${color} 62%, #000000)`;
  return (
    <g>
      <rect x="-31" y="-8" width="62" height="17" rx="8.5" style={{ fill: color }} />
      <rect x="-31" y="1" width="62" height="3.5" style={{ fill: dark }} opacity="0.55" />
      <g transform={facing === "left" ? "translate(-14 4) scale(-1 1)" : "translate(14 4)"}>
        <g data-tail>
          <path d="M0 0 L19 0 L23 38 L3 38 Z" style={{ fill: color }} />
          <rect x="2" y="22" width="21" height="4" style={{ fill: dark }} opacity="0.6" />
        </g>
      </g>
    </g>
  );
}

export function Snowman({ hat, scarf, facing = "right" }) {
  return (
    <g data-snow>
      <ellipse cy="3" rx="74" ry="9" style={{ fill: "var(--sm-shadow)" }} />
      <g data-breathe>
        <g data-squash>
          <circle cy="-62" r="62" style={BODY} />
          <ellipse cx="-24" cy="-94" rx="17" ry="10" fill="#fff" opacity="0.35" />
          {[-42, -62, -82].map((y) => (
            <circle key={y} cy={y} r="4.6" style={COAL} />
          ))}
          <circle cy="-146" r="45" style={BODY} />
          <ellipse cx="-16" cy="-170" rx="12" ry="7" fill="#fff" opacity="0.3" />

          <g transform="translate(38 -152)">
            <g data-arm-r>
              <path d="M0 0 L52 -26" style={STICK} />
              <path d="M32 -16 L38 -36" style={STICK} />
              <path d="M46 -23 L60 -31" style={STICK} />
            </g>
          </g>
          <g transform="translate(-38 -152)">
            <g data-arm-l>
              <path d="M0 0 L-52 -26" style={STICK} />
              <path d="M-32 -16 L-38 -36" style={STICK} />
              <path d="M-46 -23 L-60 -31" style={STICK} />
            </g>
          </g>

          <g transform="translate(0 -188)">
            <Scarf color={scarf} facing={facing} />
          </g>
          <g transform="translate(0 -218)">
            <g data-head>
              <Head hat={hat} color={scarf} facing={facing} />
            </g>
          </g>
        </g>
      </g>
    </g>
  );
}
