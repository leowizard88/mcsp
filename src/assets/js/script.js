document.documentElement.classList.add('js');
const links = document.querySelectorAll('.vertical-nav a');
const sections = [...links].map(a => document.querySelector(a.getAttribute('href').replace('/',''))).filter(Boolean);
const mark = () => {
  let current = sections[0];
  for (const s of sections) if (s.getBoundingClientRect().top < innerHeight * .45) current = s;
  links.forEach(a => a.classList.toggle('is-active', a.getAttribute('href').endsWith('#'+current.id)));
};
addEventListener('scroll', mark, {passive:true}); mark();

const homeFix = document.createElement('style');
homeFix.textContent = `
body:has(#home),body:has(#home) .site-main{background:#ead7b3!important}
body .site-main #home.hero-panel,body .site-main #home.hero-panel::before{background:linear-gradient(115deg,#efdfc1 0%,#ddc595 100%)!important}
body .site-main #home.hero-panel .bg-daisies{display:none!important;opacity:0!important}
body .site-main #home.hero-panel .bg-score{left:-8%!important;top:-10%!important;width:83%!important;height:118%!important;background-size:cover!important;background-position:left center!important;opacity:.24!important;transform:rotate(0deg)!important;-webkit-mask-image:linear-gradient(90deg,rgba(0,0,0,.92) 0%,rgba(0,0,0,.76) 56%,transparent 100%)!important;mask-image:linear-gradient(90deg,rgba(0,0,0,.92) 0%,rgba(0,0,0,.76) 56%,transparent 100%)!important}
body .site-main #home.hero-panel .hero-copy h2{margin-left:0!important;max-width:min(640px,58vw)!important;text-align:justify!important;text-align-last:left!important}
@media(max-width:760px){body .site-main #home.hero-panel .bg-score{left:-28%!important;top:-8%!important;width:150%!important;height:112%!important;background-size:cover!important;background-position:left center!important;opacity:.18!important}body .site-main #home.hero-panel .hero-copy h2{margin-left:0!important;max-width:calc(100vw - 82px)!important;text-align:justify!important;text-align-last:left!important}}
`;
document.head.appendChild(homeFix);
