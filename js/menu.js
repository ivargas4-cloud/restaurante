const PAGINA_RESERVAS='index.html'; // página de Reservas
const $=id=>document.getElementById(id);
/* img: ruta de una foto real (ej. 'img/bruschetta.jpg'); si está vacío se muestra el emoji */
const CATS=[
 {n:'Entradas',i:'🍴',c:'var(--c1)',items:[
  {n:'Bruschetta clásica',d:'Pan artesanal con tomate y albahaca.',p:8500,e:'🥖',h:28,img:''},
  {n:'Ensalada César',d:'Lechuga fresca, pollo, crotones y aderezo.',p:10000,e:'🥗',h:100,img:''},
  {n:'Empanadas criollas',d:'Rellenas de carne y papa, con ají casero.',p:7000,e:'🥟',h:38,img:''},
  {n:'Nachos con guacamole',d:'Totopos crujientes, guacamole y queso gratinado.',p:11000,e:'🥑',h:110,img:''},
  {n:'Croquetas de jamón',d:'Seis croquetas doradas con salsa tártara.',p:9500,e:'🧆',h:32,img:''},
  {n:'Sopa de tomate',d:'Cremosa, con albahaca fresca y pan tostado.',p:8000,e:'🍅',h:8,img:''},
  {n:'Alitas BBQ',d:'Alitas de pollo bañadas en salsa barbacoa.',p:12500,e:'🍗',h:22,img:''},
  {n:'Patacones con hogao',d:'Plátano verde frito con hogao y queso rallado.',p:8000,e:'🍌',h:50,img:''}]},
 {n:'Platos fuertes',i:'🍽️',c:'var(--c2)',items:[
  {n:'Bandeja paisa',d:'Frijoles, arroz, chicharrón, carne, huevo y plátano.',p:28000,e:'🍛',h:30,img:''},
  {n:'Salmón a la plancha',d:'Con puré de papa y vegetales salteados.',p:34000,e:'🐟',h:15,img:''},
  {n:'Pasta Alfredo con pollo',d:'Pasta cremosa con pollo y parmesano.',p:24000,e:'🍝',h:45,img:''},
  {n:'Lomo de res al vino',d:'Lomo tierno en salsa de vino tinto y papas rústicas.',p:36000,e:'🥩',h:355,img:''},
  {n:'Pollo a la parrilla',d:'Media pechuga marinada, arroz y ensalada fresca.',p:26000,e:'🍖',h:25,img:''},
  {n:'Arroz con mariscos',d:'Camarones, calamar y almejas en arroz sofrito.',p:32000,e:'🦐',h:12,img:''},
  {n:'Churrasco con papas',d:'Corte de res a la brasa con papas a la francesa.',p:33000,e:'🥓',h:5,img:''},
  {n:'Lasaña de carne',d:'Capas de pasta, carne, bechamel y queso gratinado.',p:25000,e:'🧀',h:42,img:''}]},
 {n:'Bebidas',i:'🥤',c:'var(--c3)',items:[
  {n:'Limonada de coco',d:'Refrescante, con leche de coco y hielo.',p:9000,e:'🥥',h:190,img:''},
  {n:'Jugo de lulo',d:'Natural, preparado en agua o en leche.',p:7000,e:'🍹',h:75,img:''},
  {n:'Café de origen',d:'Grano santandereano, servido caliente.',p:5000,e:'☕',h:25,img:''},
  {n:'Limonada cerezada',d:'Limón, cerezas y un toque de menta.',p:8000,e:'🍒',h:350,img:''},
  {n:'Jugo de mora',d:'Mora de Castilla natural, en agua o leche.',p:6500,e:'🫐',h:280,img:''},
  {n:'Té frío de durazno',d:'Té negro infusionado con durazno y hielo.',p:6000,e:'🍑',h:20,img:''},
  {n:'Malteada de vainilla',d:'Helado de vainilla, leche y crema chantilly.',p:11000,e:'🥛',h:210,img:''},
  {n:'Agua con gas',d:'Botella de 330 ml, bien fría.',p:4000,e:'💧',h:200,img:''}]},
 {n:'Postres',i:'🍰',c:'var(--c4)',items:[
  {n:'Tiramisú',d:'Postre tradicional con café y mascarpone.',p:6500,e:'🍰',h:20,img:''},
  {n:'Brownie con helado',d:'Brownie tibio de chocolate con helado de vainilla.',p:8000,e:'🍫',h:18,img:''},
  {n:'Flan de caramelo',d:'Suave y cremoso, bañado en caramelo casero.',p:6000,e:'🍮',h:35,img:''},
  {n:'Cheesecake de maracuyá',d:'Base de galleta y cobertura de maracuyá.',p:9000,e:'🥭',h:48,img:''},
  {n:'Tres leches',d:'Bizcocho húmedo con crema y canela.',p:7500,e:'🧁',h:340,img:''},
  {n:'Helado artesanal',d:'Tres bolas a elección: vainilla, mora o chocolate.',p:7000,e:'🍦',h:330,img:''},
  {n:'Arroz con leche',d:'Receta casera con canela y pasas.',p:5500,e:'🥣',h:40,img:''},
  {n:'Tarta de limón',d:'Masa crocante con crema de limón y merengue.',p:8000,e:'🍋',h:55,img:''}]}
];
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
  activa=k;$('q').value='';
  document.querySelectorAll('.cat').forEach((b,i)=>b.setAttribute('aria-pressed',i===k));
  render(CATS[k].items.map((x,j)=>({x,c:CATS[k],k,j})),CATS[k].n);
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
$('q').addEventListener('input',buscar);
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
const PAGINA_INICIO='';
function irInicio(e){e&&e.preventDefault();PAGINA_INICIO?location.href=PAGINA_INICIO:toast('Volver: aquí te llevaría al Inicio del restaurante')}
$('back').onclick=irInicio;$('navInicio').onclick=irInicio;
document.querySelectorAll('[data-soon]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();toast(a.textContent+': página fuera del alcance del prototipo')}));

mostrarCategoria(0);