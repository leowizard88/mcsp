(() => {
  const css = document.createElement('style');
  css.textContent = `
    .binder-slot.is-specific{
      border:2px solid #ffd75a!important;
      background:linear-gradient(135deg,rgba(255,255,255,.72),rgba(255,225,92,.62),rgba(160,95,0,.34))!important;
      box-shadow:
        inset 0 0 13px rgba(255,255,210,.72),
        inset 0 0 28px rgba(255,169,0,.38),
        0 0 10px rgba(255,217,83,.48),
        0 0 21px rgba(255,170,0,.25)!important;
    }
    .binder-slot.is-specific::before{
      background:linear-gradient(135deg,#fff7b6,#d19000 45%,#fff0a0)!important;
      color:#2b1400!important;
      border:1px solid #fff2a7!important;
      text-shadow:0 1px 0 rgba(255,255,255,.75)!important;
      box-shadow:0 0 8px rgba(255,210,70,.76)!important;
    }
    .binder-slot.is-specific::after{
      content:"";
      position:absolute;
      inset:-2px;
      pointer-events:none;
      border-radius:2px;
      background:linear-gradient(115deg,transparent 0%,transparent 32%,rgba(255,255,255,.78) 45%,rgba(255,235,125,.58) 49%,transparent 62%,transparent 100%);
      mix-blend-mode:screen;
      opacity:.72;
      transform:translateX(-140%);
      animation:giGoldShine 3.2s ease-in-out infinite;
    }
    .binder-slot.is-specific.is-filled{
      border-color:#fff0a2!important;
      background:linear-gradient(135deg,#fff7cf 0%,#ffd75a 38%,#b76b00 100%)!important;
      box-shadow:
        inset 0 0 18px rgba(255,255,255,.74),
        inset 0 0 28px rgba(255,166,0,.52),
        0 0 12px rgba(255,226,104,.72),
        0 0 28px rgba(255,166,0,.45)!important;
    }
    @keyframes giGoldShine{
      0%,48%{transform:translateX(-145%);opacity:0}
      58%{opacity:.82}
      75%{transform:translateX(145%);opacity:.2}
      100%{transform:translateX(145%);opacity:0}
    }
    @media (prefers-reduced-motion: reduce){
      .binder-slot.is-specific::after{animation:none;opacity:.22;transform:none}
    }
  `;
  document.head.appendChild(css);
})();
