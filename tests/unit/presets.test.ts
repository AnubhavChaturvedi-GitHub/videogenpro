// Pack 1 — preset purity / range guards.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { textPresets } from '../../packages/core/src/presets/text';
import { imagePresets } from '../../packages/core/src/presets/image';
import { enterPresets } from '../../packages/core/src/presets/enter';
import { exitPresets } from '../../packages/core/src/presets/exit';
import { resolveParams, type Preset } from '../../packages/core/src/preset';

const ctx = (dur = 0.6, index = 0, count = 1) => ({ index, count, time: 0, dur });
const NUMS = ['x', 'y', 'scale', 'rotate', 'opacity', 'blur', 'brightness'] as const;
const finite = (d: any) => NUMS.every((k) => d[k] === undefined || Number.isFinite(d[k]));

test('bug30: text.scramble jitter stays within +/- amount on every axis (was ~3x via sign-preserving %)', () => {
  const p = textPresets.find((x) => x.id === 'text.scramble')!;
  assert.ok(p?.apply, 'scramble has apply');
  const prm = resolveParams(p, {}); const amt = prm.amount;
  for (let i = 0; i < 16; i++) {
    for (const t of [0, 0.1, 0.25, 0.4, 0.6]) {
      const d: any = p.apply!(t, prm, ctx(1.2, i, 16));
      assert.ok(Math.abs(d.x ?? 0) <= amt + 1e-6, `scramble |x| ${d.x} <= ${amt} (i=${i},t=${t})`);
      assert.ok(Math.abs(d.y ?? 0) <= amt + 1e-6, `scramble |y| ${d.y} <= ${amt} (i=${i},t=${t})`);
    }
  }
});

test('bug30: image.glitch horizontal tear stays within +/- amount', () => {
  const g = imagePresets.find((x) => x.id === 'image.glitch')!;
  assert.ok(g?.apply, 'glitch has apply');
  const prm = resolveParams(g, {}); const amt = prm.amount;
  for (let n = 0; n < 200; n++) {
    const d: any = g.apply!(0, prm, ctx(5) as any);
    // sweep time via ctx.time
    const dd: any = g.apply!(0, prm, { index: 0, count: 1, time: n * 0.037, dur: 5 });
    assert.ok(Math.abs(dd.x ?? 0) <= amt + 1e-6, `glitch |x| ${dd.x} <= ${amt} (time=${(n * 0.037).toFixed(3)})`);
  }
});

test('invariant: every one-shot enter/text/image preset is finite, and entrances rest at identity at p=1', () => {
  const isIdentity = (d: any) =>
    Math.abs((d.opacity ?? 1) - 1) < 0.02 && Math.abs(d.x ?? 0) < 0.02 && Math.abs(d.y ?? 0) < 0.02 &&
    Math.abs((d.scale ?? 1) - 1) < 0.02 && Math.abs(d.rotate ?? 0) < 0.02 && Math.abs(d.blur ?? 0) < 0.02;
  const check = (presets: Preset[], kind: 'in' | 'out') => {
    for (const p of presets) {
      if (!p.apply || p.continuous) continue;
      const prm = resolveParams(p, {});
      for (const t of [0, 0.5, 1]) assert.ok(finite(p.apply(t, prm, ctx())), `${p.id} finite at p=${t}`);
      if (kind === 'in') assert.ok(isIdentity(p.apply(1, prm, ctx())), `${p.id} entrance must rest at identity (p=1)`);
      else assert.ok(isIdentity(p.apply(0, prm, ctx())), `${p.id} exit must start at identity (p=0)`);
    }
  };
  check(enterPresets, 'in');
  check(exitPresets, 'out');
  // text/image one-shots: finite everywhere (identity only where it's an entrance-style)
  for (const p of [...textPresets, ...imagePresets]) {
    if (!p.apply) continue;
    const prm = resolveParams(p, {});
    for (const t of [0, 0.5, 1]) assert.ok(finite(p.apply(t, prm, ctx(0.6, 0, 3))), `${p.id} finite at p=${t}`);
  }
});

test('determinism: apply() is a pure function of (p, params, ctx)', () => {
  for (const p of [...enterPresets, ...exitPresets, ...textPresets, ...imagePresets]) {
    if (!p.apply) continue;
    const prm = resolveParams(p, {});
    const a = JSON.stringify(p.apply(0.5, prm, ctx(0.6, 2, 5)));
    const b = JSON.stringify(p.apply(0.5, prm, ctx(0.6, 2, 5)));
    assert.equal(a, b, `${p.id} must be deterministic`);
  }
});
