type Theme = 'light' | 'dark';

const applyTheme = (theme: Theme): void => {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  localStorage.setItem('theme', theme);
};

const getCurrentTheme = (): Theme => {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
};

const toggleTheme = (): void => {
  const currentTheme = getCurrentTheme();
  const newTheme: Theme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
};

export const toggleThemeWithAnimation = async (event: MouseEvent): Promise<void> => {
  const x = event.clientX;
  const y = event.clientY;

  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  if (!document.startViewTransition) {
    toggleTheme();
    return;
  }

  const transition = document.startViewTransition(() => {
    toggleTheme();
  });

  await transition.ready;

  document.documentElement.animate(
    {
      clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`],
    },
    {
      duration: 500,
      easing: 'ease-out',
      pseudoElement: '::view-transition-new(root)',
    }
  );
};
