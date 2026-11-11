/**
 * Inline script that applies the stored theme before the first paint.
 * Keeps the dark-first design without a flash of the wrong theme.
 */
export const themeInitScript = `
(function () {
  try {
    var stored = window.localStorage.getItem("devreaderhub-theme");
    var theme = stored === "light" || stored === "dark" || stored === "system" ? stored : "dark";
    var resolved = theme === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : theme;
    var root = document.documentElement;
    root.classList.toggle("dark", resolved === "dark");
    root.classList.toggle("light", resolved === "light");
  } catch (e) {}
})();
`;
