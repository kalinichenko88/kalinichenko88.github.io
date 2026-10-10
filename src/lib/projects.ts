import { getCollection } from 'astro:content';

import { GITHUB_PROFILE_LINK } from '../consts';
import { githubStars } from './github-stars';

/** Every project in `order`, with its repo URL and star count. */
export async function getProjects() {
  return Promise.all(
    (await getCollection('projects'))
      .sort((a, b) => a.data.order - b.data.order)
      .map(async (entry) => {
        const { data } = entry;
        const url = `${GITHUB_PROFILE_LINK}/${data.slug}`;
        // Dev renders per request: live counts would burn the 60 req/h anonymous limit.
        const stars = import.meta.env.DEV ? data.stars : await githubStars(url, data.stars);
        // `entry` is for the project's page, which renders the Markdown body.
        return { ...data, url, stars, entry };
      })
  );
}

export type Project = Awaited<ReturnType<typeof getProjects>>[number];
