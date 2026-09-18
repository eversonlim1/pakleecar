const { head } = require('../src/seo');
const { jsonLd } = require('../src/schema');
const nav = require('./partials/nav');
const footer = require('./partials/footer');

module.exports = function layout({
  lang, slug, seo, schema = [], body, nav: navText, bodyEnd = '',
  cssHref = '/assets/css/site.css', navJsHref = '/assets/js/nav.js'
}) {
  const ld = schema.length ? jsonLd(schema) : '';
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
${head({ lang, slug, seo, extraHead: ld, cssHref })}
</head>
<body>
${nav(lang, navText)}
${body}
${footer(lang, navText)}
<script src="${navJsHref}" defer></script>
${bodyEnd}
</body>
</html>`;
};
