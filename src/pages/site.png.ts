import type { APIRoute } from 'astro';

import { CONTACT_LINKS } from '../config/contacts';
import { renderOgImage } from '../lib/og-image';
import { siteImage, toImageSite } from '../lib/site-image';

// /site.png, the link preview of every page without one of its own, rendered
// on every build, so it always shows the channels the footer lists.
export const GET: APIRoute = async () => {
  const png = await renderOgImage(siteImage(toImageSite(CONTACT_LINKS)));

  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
