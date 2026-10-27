import { getCollection } from 'astro:content';

import { GITHUB_PROFILE_LINK } from '../consts';
import { githubRepo, offlineNumbers } from './github-repo';

/** Every project in `order`, with its repo URL and its numbers from GitHub. */
export async function getProjects() {
  return Promise.all(
    (await getCollection('projects'))
      .sort((a, b) => {
        return a.data.order - b.data.order;
      })
      .map(async (entry) => {
        const { data } = entry;
        const url = `${GITHUB_PROFILE_LINK}/${data.slug}`;
        // Dev renders per request: live counts would burn the 60 req/h anonymous limit.
        const numbers = import.meta.env.DEV
          ? offlineNumbers(data.stars)
          : await githubRepo(url, data.stars);

        // `entry` is for the project's page, which renders the Markdown body.
        return { ...data, url, ...numbers, entry };
      })
  );
}

export type Project = Awaited<ReturnType<typeof getProjects>>[number];
