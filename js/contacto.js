/* Páginas a las que navegan los botones. Si está vacío, solo muestra un aviso. */
const PAGINAS={inicio:'',menu:'menu.html',reservas:'index.html'};

const $=id=>document.getElementById(id);
let tt;function toast(t){const el=$('toast');el.textContent=t;el.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>el.classList.remove('show'),2000)}
const NOMBRES={inicio:'Inicio',menu:'Menú',reservas:'Reservas'};
document.querySelectorAll('[data-go]').forEach(el=>el.addEventListener('click',e=>{
  e.preventDefault();const p=PAGINAS[el.dataset.go];
  p?location.href=p:toast('Aquí pasarías a: '+NOMBRES[el.dataset.go]);
}));
document.querySelectorAll('[data-soon]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();toast((a.getAttribute('aria-label')||a.textContent)+': enlace de ejemplo')}));

/* ---------- Carrusel de la galería ---------- */
/* img: ruta de una foto real (ej. 'img/salon.jpg'). Si está vacío se muestra el emoji. */
const SLIDES=[
  {t:'Nuestro salón',e:'🍽️',h:10,img:''},
  {t:'Hamburguesa de la casa',e:'🍔',h:30,img:''},
  {t:'Bebidas naturales',e:'🥤',h:190,img:''},
  {t:'Postres caseros',e:'🍰',h:340,img:''},
  {t:'Platos tradicionales',e:'🍛',h:40,img:''},
  {t:'Entradas para compartir',e:'🥗',h:100,img:''}
];
const bg=h=>`background:linear-gradient(135deg,hsl(${h} 60% 84%),hsl(${h} 55% 68%))`;
const track=$('track'),car=$('car');
let i=0,timer=null;
const auto=!matchMedia('(prefers-reduced-motion:reduce)').matches;

track.innerHTML=SLIDES.map((s,k)=>`<div class="slide" role="group" aria-roledescription="diapositiva" aria-label="${k+1} de ${SLIDES.length}: ${s.t}">
  <div class="pic" style="${bg(s.h)}">${s.img?`<img src="${s.img}" alt="${s.t}">`:`<span aria-hidden="true">${s.e}</span>`}</div></div>`).join('');
$('dots').innerHTML=SLIDES.map((s,k)=>`<button class="dot" type="button" data-k="${k}" aria-label="Ir a la imagen ${k+1}"></button>`).join('');

function ir(n){
  i=(n+SLIDES.length)%SLIDES.length;
  track.style.transform=`translateX(-${i*100}%)`;
  document.querySelectorAll('.dot').forEach((d,k)=>d.setAttribute('aria-current',k===i));
  document.querySelectorAll('.slide').forEach((s,k)=>s.setAttribute('aria-hidden',k!==i));
}
const parar=()=>{clearInterval(timer);timer=null};
const iniciar=()=>{parar();if(auto)timer=setInterval(()=>ir(i+1),4500)};

$('prev').onclick=()=>{ir(i-1);iniciar()};
$('next').onclick=()=>{ir(i+1);iniciar()};
$('dots').addEventListener('click',e=>{const b=e.target.closest('.dot');if(b){ir(+b.dataset.k);iniciar()}});
car.addEventListener('mouseenter',parar);
car.addEventListener('mouseleave',iniciar);
car.addEventListener('focusin',parar);
car.addEventListener('focusout',iniciar);
car.addEventListener('keydown',e=>{
  if(e.key==='ArrowLeft'){ir(i-1);e.preventDefault()}
  if(e.key==='ArrowRight'){ir(i+1);e.preventDefault()}
});
/* Deslizar con el dedo o con el mouse */
let x0=null;const vp=$('viewport');
vp.addEventListener('pointerdown',e=>{x0=e.clientX});
vp.addEventListener('pointerup',e=>{
  if(x0===null)return;const dx=e.clientX-x0;x0=null;
  if(Math.abs(dx)>40){ir(dx<0?i+1:i-1);iniciar()}
});
vp.addEventListener('pointercancel',()=>{x0=null});

ir(0);iniciar();