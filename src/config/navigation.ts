type NavLink = {
  href: string;
  label: string;
};

export const NAV_LINKS: NavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/projects', label: 'Projects' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About' },
  { href: '/#contact', label: 'Contact' },
];

/** Whether the nav item `href` is the page at `path`, or a section of it. */
export function isActive(href: string, path: string): boolean {
  if (href === '/') return path === '/';
  if (href.startsWith('/#')) return false;
  return path === href || path.startsWith(href + '/');
}
