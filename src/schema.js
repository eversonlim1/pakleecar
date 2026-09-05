const { pageUrl } = require('../build.config');
const { abs } = require('./seo');

const IG = 'https://www.instagram.com/paklee.carkorea/';
const PHONE = '+821094157859';

function jsonLd(objects) {
  const payload = JSON.stringify(objects.length === 1 ? objects[0] : objects)
    .replace(/</g, '\\u003c');
  return `<script type="application/ld+json">${payload}</script>`;
}

function organization() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: "Pak Lee's Car",
    url: abs('/'),
    logo: abs('/assets/img/paklee-avatar.jpg'),
    telephone: PHONE,
    sameAs: [IG]
  };
}

function localBusiness(rates) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: "Pak Lee's Car",
    url: abs('/'),
    image: abs('/assets/img/paklee-avatar.jpg'),
    telephone: PHONE,
    priceRange: '₩150,000 - ₩500,000',
    address: { '@type': 'PostalAddress', addressCountry: 'KR', addressLocality: 'Seoul' },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Korea Private Car Tours',
      itemListElement: rates.map(r => ({
        '@type': 'Offer', name: r.name, price: r.amount, priceCurrency: 'KRW'
      }))
    }
  };
}

function breadcrumb(lang, slug, name) {
  const items = [{
    '@type': 'ListItem', position: 1, name: 'Home', item: abs(pageUrl(lang, 'home'))
  }];
  if (slug !== 'home') {
    items.push({
      '@type': 'ListItem', position: 2, name, item: abs(pageUrl(lang, slug))
    });
  }
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items };
}

function touristTrip({ lang, slug, name, description, price }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name,
    description,
    url: abs(pageUrl(lang, slug)),
    provider: { '@type': 'Organization', name: "Pak Lee's Car", url: abs('/') },
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency: 'KRW',
      availability: 'https://schema.org/InStock',
      url: abs(pageUrl(lang, slug))
    }
  };
}

function faqPage(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a }
    }))
  };
}

function videoObject(reel, lang) {
  const name = resolveLocalized(reel.title, lang);
  if (!name) {
    throw new Error(`videoObject: reel ${reel.id}에 사용 가능한 title이 없습니다`);
  }
  const description = resolveLocalized(reel.description, lang) || name;
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name,
    description,
    thumbnailUrl: abs(reel.thumb),
    uploadDate: reel.uploadDate,
    duration: reel.duration,
    embedUrl: `https://www.instagram.com/reel/${reel.id}/embed/`,
    contentUrl: `https://www.instagram.com/reel/${reel.id}/`,
    publisher: { '@type': 'Organization', name: "Pak Lee's Car", url: abs('/') }
  };
}

function resolveLocalized(map, lang) {
  if (!map) return undefined;
  if (map[lang]) return map[lang];
  if (map.en) return map.en;
  const first = Object.values(map).find(v => v);
  return first;
}

function article({ lang, slug, headline, description, datePublished }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    datePublished,
    inLanguage: lang,
    mainEntityOfPage: abs(pageUrl(lang, slug)),
    author: { '@type': 'Person', name: 'Pak Lee' },
    publisher: { '@type': 'Organization', name: "Pak Lee's Car", url: abs('/') }
  };
}

module.exports = {
  jsonLd, organization, localBusiness, breadcrumb,
  touristTrip, faqPage, videoObject, article
};
