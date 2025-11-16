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

export const toggleTheme = (): void => {
  const currentTheme = getCurrentTheme();
  const newTheme: Theme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
};
