import type { Loader } from 'astro/loaders';
import { Octokit } from 'octokit';

interface GitHubReposLoaderOptions {
  auth: string;
  username: string;
  includeForks?: boolean;
}

export function githubReposLoader(options: GitHubReposLoaderOptions): Loader {
  return {
    name: 'github-repos-loader',
    load: async ({ store, logger }) => {
      logger.info(`Loading GitHub repositories for user: ${options.username}`);

      const octokit = new Octokit({
        auth: options.auth,
      });

      try {
        const { data: repos } = await octokit.rest.repos.listForUser({
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
        logger.error(`Failed to load GitHub repositories: ${error}`);
        throw error;
      }
    },
  };
}
