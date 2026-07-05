document.documentElement.classList.add('js');
const links = document.querySelectorAll('.vertical-nav a');
const sections = [...links].map(a => document.querySelector(a.getAttribute('href').replace('/',''))).filter(Boolean);
const mark = () => {
  let current = sections[0];
  for (const s of sections) if (s.getBoundingClientRect().top < innerHeight * .45) current = s;
  links.forEach(a => a.classList.toggle('is-active', a.getAttribute('href').endsWith('#'+current.id)));
};
addEventListener('scroll', mark, {passive:true}); mark();
