import type { APIRoute, GetStaticPaths } from 'astro';

import { renderOgImage } from '../../../lib/og-image';
import { IMAGE_THEMES, projectImage, type ImageTheme } from '../../../lib/project-image';
import { getProjects, type Project } from '../../../lib/projects';

// /projects/<slug>/light.png and /projects/<slug>/dark.png, rendered on every
// build with that build's numbers from GitHub (and on request in dev, with the
// YAML stars). The light one is the project page's og:image; /projects shows
// the one that matches the theme.
export const getStaticPaths = (async () => {
  return (await getProjects()).flatMap((project) => {
    return IMAGE_THEMES.map((theme) => {
      return { params: { slug: project.slug, theme }, props: { project, theme } };
    });
  });
}) satisfies GetStaticPaths;

type Props = { project: Project; theme: ImageTheme };

export const GET: APIRoute<Props> = async ({ props }) => {
  const png = await renderOgImage(projectImage(props.project, props.theme));

  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
