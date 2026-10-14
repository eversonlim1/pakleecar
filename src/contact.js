// Which messenger each language's visitors actually use. Japan and Thailand
// run on LINE (WhatsApp is rare there); everyone else gets WhatsApp.
// Pak Lee's LINE is a personal invite link, which can't carry a prefilled
// message, so LINE flows have the guest copy/paste the text instead.
const WA_URL = 'https://wa.me/821094157859';
const LINE_URL = 'https://line.me/ti/p/6hxug19MGH';
const LINE_LANGS = ['ja', 'th'];

function contact(lang) {
  return LINE_LANGS.includes(lang)
    ? { line: true, name: 'LINE', url: LINE_URL }
    : { line: false, name: 'WhatsApp', url: WA_URL };
}

module.exports = { contact, WA_URL, LINE_URL };
