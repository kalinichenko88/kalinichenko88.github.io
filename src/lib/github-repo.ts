export type RepoNumbers = {
  stars: number;
  /** GitHub counts open pull requests here too. */
  issues: number;
  forks: number;
  language: string | null;
};

const cache = new Map<string, Promise<RepoNumbers>>();

/**
 * Live numbers from GitHub, or `offlineNumbers(fallbackStars)` (the YAML stars)
 * on any failure, so a rate limit or outage never fails the build. Asked once
 * per repo per build, however many pages and images show them.
 */
export function githubRepo(repoUrl: string, fallbackStars: number): Promise<RepoNumbers> {
  let numbers = cache.get(repoUrl);
  if (!numbers) {
    cache.set(repoUrl, (numbers = fetchNumbers(repoUrl, fallbackStars)));
  }

  return numbers;
}

/** The numbers without GitHub: the YAML stars, and none of the rest. */
export function offlineNumbers(stars: number): RepoNumbers {
  return { stars, issues: 0, forks: 0, language: null };
}

async function fetchNumbers(repoUrl: string, fallbackStars: number): Promise<RepoNumbers> {
  const token = process.env.GITHUB_TOKEN;
  try {
    const res = await fetch(
      repoUrl.replace('https://github.com/', 'https://api.github.com/repos/'),
      {
        headers: token ? { authorization: `Bearer ${token}` } : {},
        signal: AbortSignal.timeout(5000),
      }
    );
    const { stargazers_count, open_issues_count, forks_count, language } = await res.json();
    const counts = [stargazers_count, open_issues_count, forks_count];
    if (
      !counts.every((count) => {
        return typeof count === 'number';
      })
    ) {
      throw new Error(`HTTP ${res.status}`);
    }

    return {
      stars: stargazers_count,
      issues: open_issues_count,
      forks: forks_count,
      language: typeof language === 'string' ? language : null,
    };
  } catch (error) {
    console.warn(
      `[github-repo] ${repoUrl}: ${(error as Error).message}; using ${fallbackStars} stars from YAML`
    );

    return offlineNumbers(fallbackStars);
  }
}
