(() => {
  const css = document.createElement('style');
  css.textContent = `
    body.has-greed-profile .greed-island-page,
    body.has-greed-profile .greed-game{
      background:#050000!important;
    }
    body.has-greed-profile .map-world{
      background:linear-gradient(rgba(0,0,0,.04),rgba(0,0,0,.18)),url('/assets/img/greed.png') center/cover no-repeat!important;
    }
  `;
  document.head.appendChild(css);
})();
