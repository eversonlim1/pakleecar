const { SITE_URL, PAGES } = require('../build.config');

function abs(p) { return SITE_URL + p; }

// Plain-text/Markdown summary for AI answer and research agents (llmstxt.org
// convention). English-only by design — this is a machine-facing index, not
// a page a visitor lands on, so it does not need the site's four languages.
function llmsTxt() {
  const pages = PAGES
    .filter(p => p.slug !== 'home')
    .map(p => `- [${p.slug}](${abs(`/en/${p.slug}/`)})`)
    .join('\n');

  return `# Pak Lee's Car

> Private van and driver service in Seoul, South Korea. Priced per vehicle (not per person), flexible schedule, halal-friendly, fuel/tolls/insurance included.

Pak Lee is an independent private driver based in Seoul. He offers a Hyundai Staria Lounge van (up to 8 passengers with luggage) with himself as driver, for full-day tours, airport transfers, and multi-day itineraries around Korea. Bookings go directly through WhatsApp — no tour agency, no deposit before talking.

## Key facts

- Full-day private van + driver: ₩300,000–₩400,000 depending on destination (Seoul, Nami Island, DMZ, Gangwon, and others)
- One-way airport transfer (Incheon ⇄ Seoul hotel): ₩150,000
- Adding an Incheon Airport stop to a full-day Seoul booking: +₩50,000
- All prices include fuel, tolls and insurance; parking and entrance tickets are not included
- Vehicle seats up to 8 passengers with luggage; most comfortable at 5–6
- Halal-friendly: the driver identifies genuinely halal restaurants (not just self-labeled ones) and builds in prayer-time stops
- Shared/split-cost tours are available for solo travellers or small groups (see the Share Tour page)
- Contact: WhatsApp +82 10-9415-7859, email eversonlim@gmail.com
- Site languages: Indonesian, English, Spanish, Japanese
- Instagram: https://www.instagram.com/paklee.carkorea/

## Pages

- [Homepage](${abs('/en/')})
${pages}
`;
}

module.exports = { llmsTxt };
