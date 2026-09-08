const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { sitemapXml, robotsTxt } = require('../src/sitemap');

test('sitemap에 60개 url이 있다', () => {
  const x = sitemapXml();
  assert.strictEqual((x.match(/<url>/g) || []).length, 60);
});

test('각 url이 5개 hreflang 대체링크를 갖는다', () => {
  const x = sitemapXml();
  assert.strictEqual((x.match(/xhtml:link/g) || []).length, 60 * 5);
});

test('sitemap이 절대 URL만 쓴다', () => {
  const x = sitemapXml();
  assert.doesNotMatch(x, /<loc>\//);
});

test('robots가 sitemap을 가리킨다', () => {
  assert.match(robotsTxt(), /Sitemap: https:\/\/pakleecar\.vercel\.app\/sitemap\.xml/);
});

test('빌드가 sitemap.xml과 robots.txt를 dist에 쓴다', () => {
  const ROOT = path.join(__dirname, '..');
  execFileSync('node', ['build.js'], { cwd: ROOT, stdio: 'pipe' });
  assert.ok(fs.existsSync(path.join(ROOT, 'dist', 'sitemap.xml')));
  assert.ok(fs.existsSync(path.join(ROOT, 'dist', 'robots.txt')));
});
