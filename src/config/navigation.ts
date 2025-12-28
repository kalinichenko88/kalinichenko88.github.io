type NavLink = {
  href: string;
  label: string;
};

export const NAV_LINKS: NavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/blog', label: 'Blog' },
  { href: '/#projects', label: 'Projects' },
  { href: '/#contact', label: 'Contact' },
];
