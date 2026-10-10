const cache = new Map<string, Promise<number>>();

/**
 * Live star count from GitHub, or `fallback` (the YAML value) on any failure,
 * so a rate limit or outage never fails the build. Asked once per repo per
 * build, however many pages show the count.
 */
export function githubStars(repoUrl: string, fallback: number): Promise<number> {
  let stars = cache.get(repoUrl);
  if (!stars) cache.set(repoUrl, (stars = fetchStars(repoUrl, fallback)));
  return stars;
}

async function fetchStars(repoUrl: string, fallback: number): Promise<number> {
  const token = process.env.GITHUB_TOKEN;
  try {
    const res = await fetch(
      repoUrl.replace('https://github.com/', 'https://api.github.com/repos/'),
      {
        headers: token ? { authorization: `Bearer ${token}` } : {},
        signal: AbortSignal.timeout(5000),
      }
    );
    const { stargazers_count } = await res.json();
    if (typeof stargazers_count !== 'number') throw new Error(`HTTP ${res.status}`);
    return stargazers_count;
  } catch (error) {
    console.warn(
      `[github-stars] ${repoUrl}: ${(error as Error).message}; using ${fallback} from YAML`
    );
    return fallback;
  }
}
