// Copied from materialize docs
// Looks like the nav bar needs a button with 'btn-switch-theme' class to toggle dark mode
// Change Theme Setting with a Switch
  function getTheme() {
    const isDarkModeEnabledViaCss = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const currentTheme = localStorage.getItem('theme');
    const isDark = currentTheme ? currentTheme === 'dark' : isDarkModeEnabledViaCss;
    return isDark;
  }

  function setTheme(enableDark) {
    document.documentElement.setAttribute('theme', enableDark ? 'dark' : 'light');
    localStorage.setItem('theme', enableDark ? 'dark' : 'light');
  }

  function updateDarkModeButtonState(isCurrentlyDarkModeEnabled) {
    const element = document.querySelector('.btn-switch-theme');
    element.classList.remove('is-dark');
    if (isCurrentlyDarkModeEnabled) element.classList.add('is-dark');
    element.querySelector('span').innerText = isCurrentlyDarkModeEnabled ? 'light_mode' : 'dark_mode';
    element.title = 'Switch to ' + (isCurrentlyDarkModeEnabled ? 'light' : 'dark') + ' mode';
  }

// Init Theme and Buttons
document.addEventListener('DOMContentLoaded', () => {
  const darkModeButtons = document.querySelectorAll('.btn-switch-theme');

  if (!darkModeButtons.length) {
    console.warn('Dark mode buttons not found');
    return;
  }

  darkModeButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Toggling dark mode');

      const nextState = !getTheme(); // toggle theme
      setTheme(nextState);
      //updateDarkModeButtonState(nextState);
    });
  });

  const currentState = getTheme();
  setTheme(currentState);
  //updateDarkModeButtonState(currentState);
});
