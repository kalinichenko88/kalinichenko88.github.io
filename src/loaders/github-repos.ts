import type { Loader } from 'astro/loaders';
import { Octokit } from 'octokit';
import { RequestError } from '@octokit/request-error';

type GitHubReposLoaderOptions = {
  auth: string;
  username: string;
  includeForks?: boolean;
};

export function githubReposLoader(options: GitHubReposLoaderOptions): Loader {
  return {
    name: 'github-repos-loader',
    load: async ({ store, logger }) => {
      logger.info(`Loading GitHub repositories for user: ${options.username}`);

      const octokit = new Octokit({
        auth: options.auth,
      });

      try {
        const repos = await octokit.paginate(octokit.rest.repos.listForUser, {
          username: options.username,
          type: 'owner',
          per_page: 100,
          sort: 'updated',
        });

        const filteredRepos = options.includeForks ? repos : repos.filter((repo) => !repo.fork);

        logger.info(`Found ${filteredRepos.length} repositories`);

        store.clear();

        for (const repo of filteredRepos) {
          store.set({
            id: repo.name,
            data: {
              name: repo.name,
              full_name: repo.full_name,
              description: repo.description,
              html_url: repo.html_url,
              homepage: repo.homepage,
              stargazers_count: repo.stargazers_count,
              forks_count: repo.forks_count,
              language: repo.language,
              topics: repo.topics || [],
              created_at: repo.created_at,
              updated_at: repo.updated_at,
              pushed_at: repo.pushed_at,
              size: repo.size,
              open_issues_count: repo.open_issues_count,
              default_branch: repo.default_branch,
              private: repo.private,
              fork: repo.fork,
            },
          });
        }

        logger.info(`Successfully loaded ${filteredRepos.length} repositories`);
      } catch (error) {
        if (error instanceof RequestError) {
          if (error.status === 403 && error.response?.headers['x-ratelimit-remaining'] === '0') {
            const resetTime = error.response?.headers['x-ratelimit-reset'];
            const resetDate = resetTime ? new Date(parseInt(resetTime) * 1000) : null;
            logger.error(
              `GitHub API rate limit exceeded. Resets at: ${resetDate?.toISOString() ?? 'unknown'}`
            );
            throw new Error(
              `GitHub API rate limit exceeded. Please try again after ${resetDate?.toLocaleTimeString() ?? 'some time'}.`
            );
          }

          if (error.status === 401) {
            logger.error('GitHub authentication failed. Check your GITHUB_TOKEN.');
            throw new Error(
              'GitHub authentication failed. Please verify your GITHUB_TOKEN is valid.'
            );
          }

          if (error.status === 404) {
            logger.error(`GitHub user "${options.username}" not found.`);
            throw new Error(`GitHub user "${options.username}" not found.`);
          }
        }

        logger.error(`Failed to load GitHub repositories: ${error}`);
        throw error;
      }
    },
  };
}
