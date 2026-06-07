// Pack 1 — schema hardening. Each test encodes the DESIRED behaviour; it fails
// against the un-hardened schema (reproducing the bug) and passes after the fix.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateComposition } from '../../packages/core/src/index';

const valid = (over: any = {}) => ({ fps: 30, width: 1280, height: 720, scenes: [{ duration: 5, layers: [] }], ...over });
const accepts = (c: any, msg?: string) => assert.doesNotThrow(() => validateComposition(c), msg);
const rejects = (c: any, msg?: string) => assert.throws(() => validateComposition(c), msg);
const sceneWith = (layer: any) => ({ scenes: [{ duration: 5, layers: [layer] }] });

test('baseline: a normal composition validates', () => {
  accepts(valid());
  accepts(valid(sceneWith({ type: 'image', src: 'x.png', crop: { t: 10, r: 20, b: 0, l: 5 } })));
});

test('bug1: non-finite / non-positive fps, width, height, scene.duration are rejected', () => {
  rejects(valid({ fps: Infinity }));
  rejects(valid({ width: Infinity }));
  rejects(valid({ height: Infinity }));
  rejects(valid({ scenes: [{ duration: Infinity, layers: [] }] }));
  rejects(valid({ fps: 0 }));
  rejects(valid({ width: -100 }));
});

test('bug7: unknown preset / fx / transition ids are rejected; real ones accepted', () => {
  accepts(valid(sceneWith({ type: 'text', text: 'hi', presets: [{ id: 'text.fade-up' }] })));
  rejects(valid(sceneWith({ type: 'text', text: 'hi', presets: [{ id: 'text.does-not-exist' }] })));
  accepts(valid(sceneWith({ type: 'fx', effect: 'image.ken-burns' })));
  rejects(valid(sceneWith({ type: 'fx', effect: 'totally-bogus' })));
  accepts(valid({ defaultTransition: { id: 'transition.crossfade' } }));
  rejects(valid({ defaultTransition: { id: 'transition.nope' } }));
});

test('bug8: negative timing / volume are rejected', () => {
  rejects(valid(sceneWith({ type: 'text', text: 'hi', start: -1 })));
  rejects(valid(sceneWith({ type: 'text', text: 'hi', duration: -2 })));
  rejects(valid(sceneWith({ type: 'video', src: 'v.mp4', trimStart: -1 })));
  rejects(valid({ audio: [{ src: 'a.mp3', start: -3 }] }));
  rejects(valid({ audio: [{ src: 'a.mp3', volume: -1 }] }));
});

test('bug22: every runtime easing validates; a bogus one is rejected', () => {
  const easings = ['linear', 'easeIn', 'easeOut', 'easeInOut', 'easeInCubic', 'easeOutCubic', 'easeInOutCubic', 'easeInExpo', 'easeOutExpo', 'easeInOutExpo', 'easeOutBack', 'easeInOutBack', 'easeOutQuint', 'easeInOutQuint'];
  for (const e of easings) accepts(valid(sceneWith({ type: 'text', text: 'hi', keyframes: { opacity: [{ t: 0, value: 0, easing: e }, { t: 1, value: 1, easing: e }] } })), e);
  rejects(valid(sceneWith({ type: 'text', text: 'hi', keyframes: { opacity: [{ t: 0, value: 0, easing: 'bogusEase' }] } })));
});

test('bug23: crop insets outside 0..100 are rejected', () => {
  accepts(valid(sceneWith({ type: 'image', src: 'x.png', crop: { t: 95, r: 0, b: 0, l: 0 } })));
  rejects(valid(sceneWith({ type: 'image', src: 'x.png', crop: { t: 999, r: 0, b: 0, l: 0 } })));
  rejects(valid(sceneWith({ type: 'image', src: 'x.png', crop: { t: -5, r: 0, b: 0, l: 0 } })));
});

test('regression net: every fixture composition validates', () => {
  const dir = resolve(dirname(fileURLToPath(import.meta.url)), '../fixtures');
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.json') && !n.startsWith('_'))) {
    assert.doesNotThrow(() => validateComposition(JSON.parse(readFileSync(join(dir, f), 'utf8'))), `${f} must validate`);
  }
});
