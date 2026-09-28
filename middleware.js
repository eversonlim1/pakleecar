export const config = { matcher: '/' };

const SUPPORTED = ['id', 'en', 'es', 'ja', 'th'];
const DEFAULT_LANG = 'en';

export default function middleware(request) {
  const url = new URL(request.url);
  const cookieLang = request.cookies.get('pl_lang')?.value;

  let lang = DEFAULT_LANG;
  if (cookieLang && SUPPORTED.includes(cookieLang)) {
    lang = cookieLang;
  } else {
    const accept = request.headers.get('accept-language') || '';
    const preferred = accept
      .split(',')
      .map((part) => part.split(';')[0].trim().slice(0, 2).toLowerCase())
      .find((code) => SUPPORTED.includes(code));
    if (preferred) lang = preferred;
  }

  url.pathname = `/${lang}/`;
  return Response.redirect(url, 307);
}
