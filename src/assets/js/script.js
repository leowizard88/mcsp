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
body .site-main #home.hero-panel .ultimi-movimenti-button:hover{animation:movimentiVibra .18s steps(2,end) infinite!important}
@keyframes movimentiVibra{0%{transform:translate(0,0) rotate(-.35deg)}25%{transform:translate(.7px,-.4px) rotate(.45deg)}50%{transform:translate(-.7px,.5px) rotate(-.35deg)}75%{transform:translate(.4px,.7px) rotate(.28deg)}100%{transform:translate(-.4px,0) rotate(-.35deg)}}
body .movimento-card:hover{animation:cardVibra .18s steps(2,end) infinite!important}
@keyframes cardVibra{0%{transform:rotate(var(--tilt)) translate(0,0)}25%{transform:rotate(calc(var(--tilt) * -.55)) translate(.45px,-.45px)}50%{transform:rotate(var(--tilt)) translate(-.45px,.45px)}75%{transform:rotate(calc(var(--tilt) * -.55)) translate(.35px,.35px)}100%{transform:rotate(var(--tilt)) translate(-.35px,0)}}
body .item-list{background:linear-gradient(90deg,rgba(246,242,232,.26),rgba(246,242,232,.055))!important}
body .movimento-card time{background:rgba(255,255,255,.58)!important}
body .movimento-card strong{background:rgba(255,255,255,.62)!important}
body .movimento-card span{background:rgba(255,255,255,.52)!important}
@media(max-width:760px){body .site-main #home.hero-panel .bg-score{left:-28%!important;top:-8%!important;width:150%!important;height:112%!important;background-size:cover!important;background-position:left center!important;opacity:.18!important}body .site-main #home.hero-panel .hero-copy h2{margin-left:0!important;max-width:calc(100vw - 82px)!important;text-align:justify!important;text-align-last:left!important}body .site-main #home.hero-panel .latest-drama-spine{left:8%!important;top:-11%!important;width:134%!important;height:134%!important}body .noi-panel .bg-archive{inset:-8% -20% -8% -18%!important;width:auto!important;height:auto!important;background-size:cover!important;background-position:center center!important;opacity:.30!important;-webkit-mask-image:radial-gradient(ellipse at 50% 50%,#000 0 56%,rgba(0,0,0,.58) 72%,transparent 92%)!important;mask-image:radial-gradient(ellipse at 50% 50%,#000 0 56%,rgba(0,0,0,.58) 72%,transparent 92%)!important}}
`;
document.head.appendChild(homeFix);
