import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';

import { renderOgImage } from '../../lib/og-image';
import { postImage, toImagePost, type ImagePost } from '../../lib/post-image';

// /blog/<id>.png, each post's link preview, rendered on every build from its
// frontmatter and cover, so a changed title shows in the next build. A draft
// with no cover gets none, and its page falls back to the site image.
export const getStaticPaths = (async () => {
  return (await getCollection('posts')).flatMap((post) => {
    const image = toImagePost(post);

    return image ? [{ params: { id: post.id }, props: { post: image } }] : [];
  });
}) satisfies GetStaticPaths;

type Props = { post: ImagePost };

export const GET: APIRoute<Props> = async ({ props }) => {
  const png = await renderOgImage(postImage(props.post));

  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
