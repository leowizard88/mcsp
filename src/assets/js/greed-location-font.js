(() => {
  const css = document.createElement('style');
  css.textContent = `
    .map-label,
    .map-label.forest-label{
      font-family: Arial, Helvetica, sans-serif!important;
      font-weight: 700!important;
      font-style: normal!important;
      font-size: clamp(13px,1.45vw,20px)!important;
      line-height: 1!important;
      letter-spacing: 0!important;
      text-transform: none!important;
      color: #fff!important;
      -webkit-text-stroke: 1px #000!important;
      text-shadow: none!important;
    }
    .map-label::before{
      -webkit-text-stroke: 1px #000!important;
      text-shadow: none!important;
    }
    .map-label.is-here{color:#00d12f!important}
    .map-label.can-go{color:#ffe600!important}
    .map-label.cant-go{color:#fff!important}
  `;
  document.head.appendChild(css);
})();
