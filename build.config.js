const SITE_URL = 'https://pakleecar.vercel.app';
const LANGS = ['id', 'en', 'es', 'ja'];
const DEFAULT_LANG = 'en';

const PAGES = [
  { slug: 'home',                              type: 'home',      priority: '1.0' },
  { slug: 'share-tour',                        type: 'shareTour', priority: '0.8' },
  { slug: 'videos',                            type: 'videos',    priority: '0.6' },
  { slug: 'tours/nami-island',                 type: 'tour',      priority: '0.9' },
  { slug: 'tours/seoul-day-tour',              type: 'tour',      priority: '0.9' },
  { slug: 'tours/dmz',                         type: 'tour',      priority: '0.9' },
  { slug: 'tours/gangwon-ski',                 type: 'tour',      priority: '0.8' },
  { slug: 'tours/kdrama-kpop',                 type: 'tour',      priority: '0.8' },
  { slug: 'tours/everland',                    type: 'tour',      priority: '0.8' },
  { slug: 'airport-transfer',                  type: 'tour',      priority: '0.9' },
  { slug: 'muslim-friendly-korea-tour',        type: 'tour',      priority: '0.9' },
  { slug: 'guide',                             type: 'guideHub',  priority: '0.6' },
  { slug: 'guide/halal-food-seoul',            type: 'guide',     priority: '0.7' },
  { slug: 'guide/korea-transport-vs-private-car', type: 'guide',  priority: '0.7' },
  { slug: 'guide/korea-itinerary-4-days',      type: 'guide',     priority: '0.7' }
];

function pageUrl(lang, slug) {
  return slug === 'home' ? `/${lang}/` : `/${lang}/${slug}/`;
}

module.exports = { SITE_URL, LANGS, DEFAULT_LANG, PAGES, pageUrl };
