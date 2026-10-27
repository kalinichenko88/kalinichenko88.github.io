import { getCollection } from 'astro:content';

/** Every post, newest first. */
export async function getPosts() {
  return (await getCollection('posts')).sort((a, b) => {
    return b.data.pubDate.getTime() - a.data.pubDate.getTime();
  });
}
