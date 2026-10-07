document.getElementById('btnLogin').addEventListener('click', () => {
  window.location.href = 'login.html';
});
const PAGINA_RESERVAS='index.html'; // página de Reservas
const $=id=>document.getElementById(id);
/* img: ruta de una foto real (ej. 'img/bruschetta.jpg'); si está vacío se muestra el emoji */

const fmt=p=>'$ '+p.toLocaleString('es-CO');
const bg=h=>`background:linear-gradient(135deg,hsl(${h} 60% 84%),hsl(${h} 55% 68%))`;
const pic=x=>x.img?`<img src="${x.img}" alt="${x.n}">`:`<span aria-hidden="true">${x.e}</span>`;
let activa=0;

$('cats').innerHTML=CATS.map((c,k)=>`<button class="cat" type="button" style="--cat:${c.c}" data-k="${k}" aria-pressed="false"><span class="ci" aria-hidden="true">${c.i}</span>${c.n}</button>`).join('');

function render(lista,titulo,vacio){
  $('tit').textContent=titulo;
  $('cards').className='cards';void $('cards').offsetWidth;$('cards').className='cards fade';
  $('cards').innerHTML=lista.length?lista.map(({x,c,k,j},i)=>`<article class="card" style="--cat:${c.c};animation-delay:${Math.min(i,12)*.05}s">
    <div class="img" style="${bg(x.h)}">${pic(x)}</div>
    <h3>${x.n}</h3><p class="desc">${x.d}</p><p class="price">${fmt(x.p)}</p>
    <button class="btn ghost" type="button" data-k="${k}" data-j="${j}">Ver imagen</button></article>`).join(''):`<p class="empty">${vacio}</p>`;
}
function mostrarCategoria(k){
  activa=k;
  document.querySelectorAll('.cat').forEach((b,i)=>b.setAttribute('aria-pressed',i===k));
  render(CATS[k].items.map((x,j)=>({x,c:CATS[k],k,j})).filter(obj=>obj.x.disp!==false),CATS[k].n);
  actualizarContinuar();
}
function buscar(){
  const q=$('q').value.trim().toLowerCase();
  if(!q)return mostrarCategoria(activa);
  document.querySelectorAll('.cat').forEach(b=>b.setAttribute('aria-pressed','false'));
  const r=[];CATS.forEach((c,k)=>c.items.forEach((x,j)=>{if((x.n+' '+x.d).toLowerCase().includes(q))r.push({x,c,k,j})}));
  render(r,'Resultados de la búsqueda','No encontramos platos con esa búsqueda. Prueba con otra palabra.');
}

$('cats').addEventListener('click',e=>{const b=e.target.closest('.cat');if(b)mostrarCategoria(+b.dataset.k)});
$('cards').addEventListener('click',e=>{
  const b=e.target.closest('button[data-k]');if(!b)return;
  const x=CATS[b.dataset.k].items[b.dataset.j];
  $('dimg').setAttribute('style',bg(x.h));$('dimg').innerHTML=pic(x);
  $('dn').textContent=x.n;$('dd').textContent=x.d;$('dp').textContent=fmt(x.p);
  $('dlg').showModal();
});
$('cerrar').onclick=()=>$('dlg').close();
$('dlg').addEventListener('click',e=>{if(e.target===$('dlg'))$('dlg').close()});

let tt;function toast(t){const el=$('toast');el.textContent=t;el.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>el.classList.remove('show'),2000)}
function irReservas(e){e&&e.preventDefault();PAGINA_RESERVAS?location.href=PAGINA_RESERVAS:toast('Continuar: aquí pasarías a la página de Reservas')}
function actualizarContinuar(){
  const ultima=activa===CATS.length-1;
  $('continuar').textContent=ultima?'Reservar mesa →':'Continuar →';
  $('ayuda').textContent=ultima?'Ya viste toda la carta. ¿Listo para reservar?':'Siguiente categoría: '+CATS[activa+1].n;
}
$('continuar').onclick=()=>{
  if(activa<CATS.length-1){mostrarCategoria(activa+1);$('cats').scrollIntoView({behavior:'smooth',block:'start'})}
  else irReservas();
};
$('navReservas').onclick=irReservas;
const PAGINA_INICIO='inicio.html';
function irInicio(e){e&&e.preventDefault();PAGINA_INICIO?location.href=PAGINA_INICIO:toast('Volver: aquí te llevaría al Inicio del restaurante')}
$('back').onclick=irInicio;$('navInicio').onclick=irInicio;
document.querySelectorAll('[data-soon]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();toast(a.textContent+': página fuera del alcance del prototipo')}));

mostrarCategoria(0);