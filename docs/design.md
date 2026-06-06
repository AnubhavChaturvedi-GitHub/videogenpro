# Brainfish — Style Reference (VideoGenPro theme)
> Stickers on construction paper · Theme: light · neo-brutalist

Light canvas, single vivid lime accent, hard offset shadows (zero blur), thin black borders,
pill shapes, Satoshi type (500 body / 700 display). Sticker-on-paper weight.

## Core tokens
```css
--color-lime-pulse:#a3e635;   /* sole action color */
--color-carbon-black:#000;    /* text, borders, icon strokes */
--color-paper-white:#fff;     /* canvas + cards */
--color-graphite:#171717;
--color-shadow-ink:#0a0a0d;   /* hard shadow color */
--color-fog:#f5f5f5;          /* recessed surface */
--color-steel:#737373;        /* muted text */
--color-iron:#222;            /* nav text */
--color-buttercream:#fef3c8; --color-mint-wash:#d2fae5; --color-lilac-mist:#fae9ff; --color-bubblegum:#f5d1fe;
--color-sky-wash:#b7eaf6; --color-cobalt-field:#3366e0; --color-meadow:#b9f0c0; --color-amber-spark:#fbbf25;
--font: 'Satoshi', Inter, 'DM Sans', system-ui, sans-serif;  /* 500 / 700 only */
--shadow-subtle:rgb(10,10,13) 2px 2px 0 0;
--shadow-subtle-2:rgb(10,10,13) 4px 4px 0 0;
--shadow-subtle-3:rgb(10,10,13) 1px 1px 0 0;
--radius-buttons:100px; --radius-cards:16px; --radius-inputs:4px;
```

## Rules
- Lime `#a3e635` = action only (primary buttons, selected/active states, accents).
- Every interactive surface: white fill + 1px `#000` border + hard offset shadow (2px, zero blur).
- Buttons / badges / nav = pill (100px radius). Cards = 16px. Inputs = 4px.
- Satoshi 500 body, 700 headlines. Never 400/600, never italic.
- No soft/blurred shadows. No grayscale gradients. Pastel tints for info cards only.
- Pastel card tints: buttercream / mint / lilac / bubblegum.

Full extracted spec lives in chat history / brand source: https://www.brainfishai.com
