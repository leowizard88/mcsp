(() => {
  const css = document.createElement('style');
  css.textContent = `
    .gi-chat{z-index:44!important}
    .location-panel{z-index:115!important}
    .city-popup{z-index:116!important}
    .side-menu{z-index:150!important}
    .menu-panel{z-index:151!important}
    .menu-button{z-index:152!important}
    .explore-log-scroll{overflow-y:scroll!important;scrollbar-width:auto!important;scrollbar-color:#dfff73 #132413!important}
    .explore-log-scroll::-webkit-scrollbar{width:15px!important;background:#132413!important}
    .explore-log-scroll::-webkit-scrollbar-track{background:#132413!important;border-left:1px solid rgba(223,255,115,.28)!important}
    .explore-log-scroll::-webkit-scrollbar-thumb{background:#dfff73!important;border:3px solid #132413!important;border-radius:10px!important}
    .explore-log-scroll::-webkit-scrollbar-thumb:hover{background:#fff6a0!important}
    body.menu-open .location-display,
    body.menu-open .energy-hud,
    body.menu-open .hxh-welcome,
    body.menu-open .hxh-profile-hud,
    body.menu-open [data-energy-hud]{z-index:24!important;opacity:.22!important;pointer-events:none!important}
    body.menu-open .location-panel{z-index:80!important}
    body.menu-open .gi-chat{z-index:40!important;opacity:.34!important}
    @media(max-width:760px){body.menu-open .gi-chat{display:none!important}}
  `;
  document.head.appendChild(css);
})();
