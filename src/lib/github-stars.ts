/**
 * Live star count for a GitHub repo, read at build time.
 *
 * Returns `fallback` (the hand-kept YAML count) whenever GitHub cannot answer:
 * a rate limit or an outage must never fail the build. CI passes the workflow's
 * built-in GITHUB_TOKEN for the higher rate limit; locally the call goes
 * unauthenticated, which is plenty for a handful of repos.
 */
export async function githubStars(repoUrl: string, fallback: number): Promise<number> {
  const token = process.env.GITHUB_TOKEN;
  try {
    const res = await fetch(
      repoUrl.replace('https://github.com/', 'https://api.github.com/repos/'),
      {
        headers: token ? { authorization: `Bearer ${token}` } : {},
        signal: AbortSignal.timeout(5000),
      }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { stargazers_count } = await res.json();
    if (typeof stargazers_count !== 'number') throw new Error('no stargazers_count');
    return stargazers_count;
  } catch (error) {
    console.warn(
      `[github-stars] ${repoUrl}: ${(error as Error).message}; using ${fallback} from YAML`
    );
    return fallback;
  }
}
