type FormatDateOptions = {
  month?: 'short' | 'long';
};

/**
 * Format a post's `pubDate` for display.
 *
 * Date-only frontmatter parses to UTC midnight, so we format in UTC to avoid an
 * off-by-one day shift when the site is built on a host west of UTC.
 */
export function formatDate(date: Date, { month = 'short' }: FormatDateOptions = {}): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month,
    day: 'numeric',
    timeZone: 'UTC',
  });
}
