const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const configSource = read('js/config.js');
const context = {};
vm.runInNewContext(`${configSource}\nthis.CONFIG = CONFIG;`, context);
const config = context.CONFIG;

test('all locally referenced stylesheets and scripts exist', () => {
  const refs = [...html.matchAll(/(?:href|src)="((?:css|js)\/[^"]+)"/g)].map((m) => m[1]);
  assert.ok(refs.length > 0);
  for (const ref of refs) assert.ok(fs.existsSync(path.join(root, ref)), `missing ${ref}`);
});

test('configured gallery images exist', () => {
  assert.ok(config.gallery.photos.length > 0);
  for (const photo of config.gallery.photos) {
    assert.ok(fs.existsSync(path.join(root, 'gallery', photo)), `missing gallery/${photo}`);
  }
});

test('the Ashu name is configured for each dynamic reveal', () => {
  assert.match(config.text.heroName, /Ashu/);
  assert.match(config.who.name, /Ashu/);
  assert.match(config.text.finalTitle, /Ashu/);
});

test('gallery has accessible previous and next controls wired in the page', () => {
  assert.match(html, /id="gallery-prev"[^>]*aria-label="Previous photo"/);
  assert.match(html, /id="gallery-next"[^>]*aria-label="Next photo"/);
  const gallery = read('js/gallery.js');
  assert.match(gallery, /addEventListener\('click', deckPrev\)/);
  assert.match(gallery, /addEventListener\('click', deckNext\)/);
});

test('all local JavaScript files parse', () => {
  for (const file of fs.readdirSync(path.join(root, 'js')).filter((f) => f.endsWith('.js'))) {
    const source = read(`js/${file}`);
    assert.doesNotThrow(() => new vm.Script(source, { filename: file }), file);
  }
});
