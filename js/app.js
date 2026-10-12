/* =====================================================================
   BUEN SABOR · js/app.js  (único archivo JavaScript del sitio)

   Cómo funciona:
     - Cada HTML tiene <body data-page="...">  (reservas, menu, inicio,
       login, establecimiento, carta-admin).
     - Al final de este archivo se lee ese valor y se ejecuta SOLO la
       función de esa página (initReservas, initMenu, ...).
     - Lo que se repite en todas las páginas (botón de sesión, menús
       desplegables, avisos) vive en initNav().
     - Los cambios de la carta se conservan en localStorage del navegador;
       no se envían a un servidor.

   Secciones:
     1. Utilidades compartidas
     2. Datos de la carta (CATS) + cambios guardados por el administrador
     3. Navegación compartida
     4. Páginas (una función por página)
     5. Arranque
   ===================================================================== */


/* ---------- 1. Utilidades compartidas ---------- */
const $ = id => document.getElementById(id);
const bg = h => `background:linear-gradient(135deg,hsl(${h} 60% 84%),hsl(${h} 55% 68%))`;
const esc = t => String(t).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

let tt;
function toast(t){
  const el = $('toast');
  if(!el) return;
  el.textContent = t;
  el.classList.add('show');
  clearTimeout(tt);
  tt = setTimeout(() => el.classList.remove('show'), 2000);
}

/* localStorage con manejo de errores (si el navegador se queda sin espacio, no se rompe nada) */
function leerLS(clave, defecto){
  try{
    const v = localStorage.getItem(clave);
    return v ? JSON.parse(v) : defecto;
  }catch(e){ return defecto; }
}
function guardarLS(clave, valor){
  try{ localStorage.setItem(clave, JSON.stringify(valor)); return true; }
  catch(e){ return false; }
}

/* Lee una imagen y la reduce (máx. 800 px) para que quepa en localStorage */
function leerImagen(archivo, max = 800){
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onerror = reject;
    lector.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const escala = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * escala);
        c.height = Math.round(img.height * escala);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.8));
      };
      img.src = lector.result;
    };
    lector.readAsDataURL(archivo);
  });
}


/* ---------- 2. Datos de la carta ---------- */
/* img: ruta de una foto real (ej. 'img/bruschetta.jpg'); si está vacío se muestra el emoji.
   disp: true = disponible, false = no disponible (no se muestra en la carta del cliente). */
const ICONOS = {
  entradas: '<svg viewBox="0 0 24 24"><path d="M7 21h10"/><path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z"/><path d="M11.38 12a2.4 2.4 0 0 1-.4-4.77 2.4 2.4 0 0 1 3.2-2.77 2.4 2.4 0 0 1 3.47-.63 2.4 2.4 0 0 1 3.37 3.37 2.4 2.4 0 0 1-1.1 3.7 2.51 2.51 0 0 1 .03 1.1"/><path d="m13 12 4-4"/><path d="M10.9 7.25A3.99 3.99 0 0 0 4 10c0 .73.2 1.41.54 2"/></svg>',
  platos: '<svg viewBox="0 0 24 24"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>',
  bebidas: '<svg viewBox="0 0 24 24"><path d="m6 8 1.75 12.28a2 2 0 0 0 2 1.72h4.54a2 2 0 0 0 2-1.72L18 8"/><path d="M5 8h14"/><path d="M7 15a6.47 6.47 0 0 1 5 0 6.47 6.47 0 0 0 5 0"/><path d="m12 8 1-6h2"/></svg>',
  postres: '<svg viewBox="0 0 24 24"><circle cx="9" cy="7" r="2"/><path d="M7.2 7.9 3 11v9c0 .6.4 1 1 1h16c.6 0 1-.4 1-1v-9c0-2-3-6-7-8l-3.6 2.6"/><path d="M16 13H3"/><path d="M16 17H3"/></svg>'
};
const CATS=[
 {n:'Entradas',i:ICONOS.entradas,c:'var(--c1)',items:[
  {n:'Bruschetta clásica',d:'Pan artesanal con tomate y albahaca.',p:8500,e:'🥖',h:28,img:'img/bruscheta1.jpg',disp:true},
  {n:'Ensalada César',d:'Lechuga fresca, pollo, crotones y aderezo.',p:10000,e:'🥗',h:100,img:'img/Ensalada-César-con-pollo1.jpg',disp:true},
  {n:'Empanadas criollas',d:'Rellenas de carne y papa, con ají casero.',p:7000,e:'🥟',h:38,img:'img/empanadas cirollas1.jpg',disp:true},
  {n:'Nachos con guacamole',d:'Totopos crujientes, guacamole y queso gratinado.',p:11000,e:'🥑',h:110,img:'img/nachos 1.jpg',disp:true},
  {n:'Croquetas de jamón',d:'Seis croquetas doradas con salsa tártara.',p:9500,e:'🧆',h:32,img:'img/croquetas_de_jamon_caseras1.jpg',disp:true},
  {n:'Sopa de tomate',d:'Cremosa, con albahaca fresca y pan tostado.',p:8000,e:'🍅',h:8,img:'img/sopa de romate.jpg',disp:true},
  {n:'Alitas BBQ',d:'Alitas de pollo bañadas en salsa barbacoa.',p:12500,e:'🍗',h:22,img:'img/alittas bbq1.jpg',disp:true},
  {n:'Patacones con hogao',d:'Plátano verde frito con hogao y queso rallado.',p:8000,e:'🍌',h:50,img:'img/patacones con hoga1.jpg',disp:true}]},
 {n:'Platos fuertes',i:ICONOS.platos,c:'var(--c2)',items:[
  {n:'Bandeja paisa',d:'Frijoles, arroz, chicharrón, carne, huevo y plátano.',p:28000,e:'🍛',h:30,img:'img/bandeja-paisa-.jpg',disp:true},
  {n:'Salmón a la plancha',d:'Con puré de papa y vegetales salteados.',p:34000,e:'🐟',h:15,img:'img/salmon.jpg',disp:true},
  {n:'Pasta Alfredo con pollo',d:'Pasta cremosa con pollo y parmesano.',p:24000,e:'🍝',h:45,img:'img/pasta alfredo.jpg',disp:true},
  {n:'Lomo de res al vino',d:'Lomo tierno en salsa de vino tinto y papas rústicas.',p:36000,e:'🥩',h:355,img:'img/lomo de res.jpg',disp:true},
  {n:'Pollo a la parrilla',d:'Media pechuga marinada, arroz y ensalada fresca.',p:26000,e:'🍖',h:25,img:'img/pollo a la aprrilla.jpg',disp:true},
  {n:'Arroz con mariscos',d:'Camarones, calamar y almejas en arroz sofrito.',p:32000,e:'🦐',h:12,img:'img/arroz de marisco.jpg',disp:true},
  {n:'Churrasco con papas',d:'Corte de res a la brasa con papas a la francesa.',p:33000,e:'🥓',h:5,img:'img/churraascp.jpg',disp:true},
  {n:'Lasaña de carne',d:'Capas de pasta, carne, bechamel y queso gratinado.',p:25000,e:'🧀',h:42,img:'img/lasaña.jpg',disp:true}]},
 {n:'Bebidas',i:ICONOS.bebidas,c:'var(--c3)',items:[
  {n:'Limonada de coco',d:'Refrescante, con leche de coco y hielo.',p:9000,e:'🥥',h:190,img:'img/limonada-de-coco_9iu1.jpg',disp:true},
  {n:'Jugo de lulo',d:'Natural, preparado en agua o en leche.',p:7000,e:'🍹',h:75,img:'img/jugo-lulo-1024x1024.jpg',disp:true},
  {n:'Café de origen',d:'Grano santandereano, servido caliente.',p:5000,e:'☕',h:25,img:'img/cafe.jpg',disp:true},
  {n:'Limonada cerezada',d:'Limón, cerezas y un toque de menta.',p:8000,e:'🍒',h:350,img:'img/Limonada de cerezas.jpg',disp:true},
  {n:'Jugo de mora',d:'Mora de Castilla natural, en agua o leche.',p:6500,e:'🫐',h:280,img:'img/receta-de-jugo-de-moras.jpg',disp:true},
  {n:'Té frío de durazno',d:'Té negro infusionado con durazno y hielo.',p:6000,e:'🍑',h:20,img:'img/Te-durazno-file.jpg',disp:true},
  {n:'Malteada de vainilla',d:'Helado de vainilla, leche y crema chantilly.',p:11000,e:'🥛',h:210,img:'img/malteada.jpg',disp:true},
  {n:'Agua con gas',d:'Botella de 330 ml, bien fría.',p:4000,e:'💧',h:200,img:'img/agia con gas.jpg',disp:true}]},
 {n:'Postres',i:ICONOS.postres,c:'var(--c4)',items:[
  {n:'Tiramisú',d:'Postre tradicional con café y mascarpone.',p:6500,e:'🍰',h:20,img:'img/tiramisu.jpg',disp:true},
  {n:'Brownie con helado',d:'Brownie tibio de chocolate con helado de vainilla.',p:8000,e:'🍫',h:18,img:'img/bronie con helado.jpg',disp:true},
  {n:'Flan de caramelo',d:'Suave y cremoso, bañado en caramelo casero.',p:6000,e:'🍮',h:35,img:'img/flan.jpg',disp:true},
  {n:'Cheesecake de maracuyá',d:'Base de galleta y cobertura de maracuyá.',p:9000,e:'🥭',h:48,img:'img/-cheesecake-de-Maracuya.jpg',disp:true},
  {n:'Tres leches',d:'Bizcocho húmedo con crema y canela.',p:7500,e:'🧁',h:340,img:'img/Tres Leches de Canela y Latte.jpg',disp:true},
  {n:'Helado artesanal',d:'Tres bolas a elección: vainilla, mora o chocolate.',p:7000,e:'🍦',h:330,img:'img/helado.jpg',disp:true},
  {n:'Arroz con leche',d:'Receta casera con canela y pasas.',p:5500,e:'🥣',h:40,img:'img/arroz_con_leche.jpg',disp:true},
  {n:'Tarta de limón',d:'Masa crocante con crema de limón y merengue.',p:8000,e:'🍋',h:55,img:'img/tarta de limon.jpg',disp:true}]}
];

/* Aplica a CATS lo que el administrador guardó en el navegador:
   1) los platos nuevos  2) los cambios de precio, disponibilidad y foto */
(function cargarCartaGuardada(){
  leerLS('menuNuevos', []).forEach(({cat, plato}) => {
    const c = CATS.find(x => x.n === cat);
    if(c) c.items.push(plato);
  });
  const cambios = leerLS('menuOverrides', {});
  CATS.forEach(cat => cat.items.forEach(item => {
    const c = cambios[cat.n + '|' + item.n];
    if(!c) return;
    if(c.p !== undefined) item.p = c.p;
    if(c.disp !== undefined) item.disp = c.disp;
    if(c.img) item.img = c.img;
  }));
})();


/* ---------- 3. Navegación compartida ---------- */
function initNav(){
  /* Botón "Iniciar Sesión" (páginas públicas) */
  const login = $('btnLogin');
  if(login) login.addEventListener('click', () => { location.href = 'login.html'; });

  /* Botones con destino fijo, ej. "← Volver":  <button data-href="inicio.html"> */
  document.querySelectorAll('[data-href]').forEach(el =>
    el.addEventListener('click', e => { e.preventDefault(); location.href = el.dataset.href; }));

  /* Enlaces a páginas que quedan fuera del alcance del prototipo */
  document.querySelectorAll('[data-soon]').forEach(a =>
    a.addEventListener('click', e => {
      e.preventDefault();
      toast((a.getAttribute('aria-label') || a.textContent.trim()) + ': fuera del alcance de la entrega');
    }));

  /* Menús desplegables del administrador ("Administración" y "Administrador ▾") */
  const pares = [['btnAdminNav','adminMenu'], ['btnUserMenu','userMenu']]
    .map(([b, m]) => [$(b), $(m)])
    .filter(([b, m]) => b && m);
  if(pares.length){
    const cerrarTodos = () => pares.forEach(([b, m]) => {
      m.hidden = true;
      b.setAttribute('aria-expanded', 'false');
    });
    pares.forEach(([b, m]) => {
      b.addEventListener('click', e => {
        e.stopPropagation();
        const estabaAbierto = !m.hidden;
        cerrarTodos();
        m.hidden = estabaAbierto;
        b.setAttribute('aria-expanded', String(!estabaAbierto));
      });
      m.querySelectorAll('a').forEach(a => a.addEventListener('click', cerrarTodos));
    });
    document.addEventListener('click', cerrarTodos);

    /* Cerrar sesión: vuelve a la carta pública */
    const salir = $('btnLogout');
    if(salir) salir.addEventListener('click', e => { e.preventDefault(); location.href = 'menu.html'; });
  }
}


/* ---------- 4. Páginas ---------- */

/* ===== Inicio (inicio.html): carrusel de la galería ===== */
function initInicio(){
  /* img: ruta de una foto real (ej. 'img/salon.jpg'). Si está vacío se muestra el emoji. */
  const SLIDES=[
    {t:'Fachada del restaurante',e:'🏠',h:10,img:'img/fachada.jpg'},
    {t:'Salón principal',e:'🍽️',h:30,img:'img/salon.jpg'},
    {t:'Terraza',e:'🌿',h:190,img:'img/terraza.jpg'},
    {t:'Barra',e:'🥂',h:340,img:'img/barra.jpg'},
    {t:'Plato estrella de la casa',e:'🍛',h:40,img:'img/imagen de foto contactp.jpg'},
    {t:'Ambiente familiar',e:'👨‍👩‍👧',h:100,img:'img/familia.jpg'}
  ];
  const track = $('track'), car = $('car'), vp = $('viewport');
  let i = 0, timer = null;
  const auto = !matchMedia('(prefers-reduced-motion:reduce)').matches;

  track.innerHTML = SLIDES.map((s,k) => `<div class="slide" role="group" aria-roledescription="diapositiva" aria-label="${k+1} de ${SLIDES.length}: ${s.t}">
    <div class="pic" style="${bg(s.h)}">${s.img ? `<img src="${s.img}" alt="${s.t}">` : `<span aria-hidden="true">${s.e}</span>`}</div></div>`).join('');
  $('dots').innerHTML = SLIDES.map((s,k) => `<button class="dot" type="button" data-k="${k}" aria-label="Ir a la imagen ${k+1}"></button>`).join('');

  function ir(n){
    i = (n + SLIDES.length) % SLIDES.length;
    track.style.transform = `translateX(-${i*100}%)`;
    document.querySelectorAll('.dot').forEach((d,k) => d.setAttribute('aria-current', k === i));
    document.querySelectorAll('.slide').forEach((s,k) => s.setAttribute('aria-hidden', k !== i));
  }
  const parar = () => { clearInterval(timer); timer = null; };
  const iniciar = () => { parar(); if(auto) timer = setInterval(() => ir(i+1), 4500); };

  $('prev').onclick = () => { ir(i-1); iniciar(); };
  $('next').onclick = () => { ir(i+1); iniciar(); };
  $('dots').addEventListener('click', e => { const b = e.target.closest('.dot'); if(b){ ir(+b.dataset.k); iniciar(); } });
  car.addEventListener('mouseenter', parar);
  car.addEventListener('mouseleave', iniciar);
  car.addEventListener('focusin', parar);
  car.addEventListener('focusout', iniciar);
  car.addEventListener('keydown', e => {
    if(e.key === 'ArrowLeft'){ ir(i-1); e.preventDefault(); }
    if(e.key === 'ArrowRight'){ ir(i+1); e.preventDefault(); }
  });
  /* Deslizar con el dedo o con el mouse */
  let x0 = null;
  vp.addEventListener('pointerdown', e => { x0 = e.clientX; });
  vp.addEventListener('pointerup', e => {
    if(x0 === null) return;
    const dx = e.clientX - x0; x0 = null;
    if(Math.abs(dx) > 40){ ir(dx < 0 ? i+1 : i-1); iniciar(); }
  });
  vp.addEventListener('pointercancel', () => { x0 = null; });

  ir(0); iniciar();
}


/* ===== Carta gastronómica (menu.html): vista del Cliente ===== */
function initMenu(){
  const fmt = p => '$ ' + p.toLocaleString('es-CO');
  const pic = x => x.img ? `<img src="${x.img}" alt="${esc(x.n)}">` : `<span aria-hidden="true">${x.e}</span>`;
  let activa = 0;

  $('cats').innerHTML = CATS.map((c,k) => `<button class="cat" type="button" style="--cat:${c.c}" data-k="${k}" aria-pressed="false"><span class="ci" aria-hidden="true">${c.i}</span>${c.n}</button>`).join('');

  function render(lista, titulo, vacio = 'No hay platos disponibles en esta categoría por ahora.'){
    $('tit').textContent = titulo;
    $('cards').className = 'cards'; void $('cards').offsetWidth; $('cards').className = 'cards fade';
    $('cards').innerHTML = lista.length ? lista.map(({x,c,k,j}, i) => `<article class="card" style="--cat:${c.c};animation-delay:${Math.min(i,12)*.05}s">
      <div class="img" style="${bg(x.h)}">${pic(x)}</div>
      <h3>${esc(x.n)}</h3><p class="desc">${esc(x.d)}</p><p class="price">${fmt(x.p)}</p>
      <button class="btn ghost" type="button" data-k="${k}" data-j="${j}">Ver imagen</button></article>`).join('') : `<p class="empty">${vacio}</p>`;
  }

  function actualizarContinuar(){
    const ultima = activa === CATS.length - 1;
    $('continuar').textContent = ultima ? 'Reservar mesa →' : 'Continuar →';
    $('ayuda').textContent = ultima ? 'Ya viste toda la carta. ¿Listo para reservar?' : 'Siguiente categoría: ' + CATS[activa+1].n;
  }

  function mostrarCategoria(k){
    activa = k;
    document.querySelectorAll('.cat').forEach((b,i) => b.setAttribute('aria-pressed', i === k));
    /* Solo se muestran los platos disponibles (disp !== false) */
    render(CATS[k].items.map((x,j) => ({x, c:CATS[k], k, j})).filter(o => o.x.disp !== false), CATS[k].n);
    actualizarContinuar();
  }

  $('cats').addEventListener('click', e => { const b = e.target.closest('.cat'); if(b) mostrarCategoria(+b.dataset.k); });
  $('cards').addEventListener('click', e => {
    const b = e.target.closest('button[data-k]'); if(!b) return;
    const x = CATS[b.dataset.k].items[b.dataset.j];
    $('dimg').setAttribute('style', bg(x.h)); $('dimg').innerHTML = pic(x);
    $('dn').textContent = x.n; $('dd').textContent = x.d; $('dp').textContent = fmt(x.p);
    $('dlg').showModal();
  });
  $('cerrar').onclick = () => $('dlg').close();
  $('dlg').addEventListener('click', e => { if(e.target === $('dlg')) $('dlg').close(); });

  $('continuar').onclick = () => {
    if(activa < CATS.length - 1){
      mostrarCategoria(activa + 1);
      $('cats').scrollIntoView({behavior:'smooth', block:'start'});
    } else location.href = 'index.html';
  };

  mostrarCategoria(0);
}


/* ===== Reserva de mesa (index.html): el Cliente elige la zona ===== */
function initReservas(){
  /* Zonas del restaurante y su aforo (personas que caben en cada una) */
  const ZONAS = [
    {id:'salon',   n:'Salón',   i:'🍽️', aforo:40},
    {id:'terraza', n:'Terraza', i:'🌿', aforo:20},
    {id:'barra',   n:'Barra',   i:'🥂', aforo:8}
  ];
  const campos = ['nombre','celular','personas','fecha','hora','correo'];

  /* Opciones de selects y fecha mínima */
  $('personas').innerHTML = '<option value="">Selecciona</option>' + Array.from({length:10}, (_,i) => `<option value="${i+1}">${i+1} ${i?'personas':'persona'}</option>`).join('');
  let h = '<option value="">Selecciona hora</option>';
  for(let m = 12*60; m <= 21*60; m += 30){ const hh = Math.floor(m/60), mm = m%60; h += `<option>${String(hh).padStart(2,'0')}:${mm?'30':'00'}</option>`; }
  $('hora').innerHTML = h;
  const hoy = new Date();
  const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const min = iso(hoy); const maxD = new Date(hoy); maxD.setDate(maxD.getDate() + 90);
  $('fecha').min = min; $('fecha').max = iso(maxD);

  /* Validaciones */
  const reglas = {
    nombre: v => !v.trim() ? 'Escribe tu nombre completo.' : !/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' ]{3,60}$/.test(v.trim()) ? 'Usa solo letras (mínimo 3).' : (v.trim().split(/\s+/).length < 2 ? 'Incluye nombre y apellido.' : ''),
    celular: v => !v ? 'Escribe tu número de celular.' : !/^3\d{9}$/.test(v) ? 'Debe tener 10 dígitos y empezar por 3.' : '',
    personas: v => !v ? 'Selecciona la cantidad de personas.' : '',
    fecha: v => !v ? 'Selecciona una fecha.' : v < min ? 'La fecha no puede ser anterior a hoy.' : v > iso(maxD) ? 'Solo se reserva con 90 días de anticipación.' : '',
    hora: v => {
      if(!v) return 'Selecciona una hora.';
      if($('fecha').value === min){ const [a,b] = v.split(':').map(Number); if(a*60+b <= hoy.getHours()*60+hoy.getMinutes()) return 'Esa hora ya pasó. Elige una posterior.'; }
      return '';
    },
    correo: v => v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? 'Escribe un correo válido, por ejemplo nombre@dominio.com.' : ''
  };
  function validar(c){
    const el = $(c), e = reglas[c](el.value), p = $('e-'+c);
    p.textContent = e; el.setAttribute('aria-invalid', e ? 'true' : 'false');
    if(e) el.setAttribute('aria-describedby', 'e-'+c); else el.removeAttribute('aria-describedby');
    return !e;
  }
  const validarTodo = () => campos.map(validar).every(Boolean);

  /* Disponibilidad simulada: lugares libres de cada zona según el día y la hora */
  const hash = s => { let x = 0; for(const ch of s) x = (x*31 + ch.charCodeAt(0)) >>> 0; return x; };
  function lugaresLibres(z, f, hr){
    if(+f.slice(-2) === 15) return 0;                       // día 15: todo reservado
    const ocupados = Math.round(z.aforo * (hash(f + hr + z.id) % 100) / 100);
    return z.aforo - ocupados;
  }
  function pintarZonas(){
    const f = $('fecha').value, hr = $('hora').value, p = +$('personas').value;
    const listo = f && hr && p && !reglas.fecha(f) && !reglas.hora(hr);
    const prev = document.querySelector('input[name=zona]:checked'), pv = prev && prev.value;
    let disponibles = 0;
    $('zones').innerHTML = ZONAS.map(z => {
      const libres = listo ? lugaresLibres(z, f, hr) : 0;
      const dis = !listo || libres < p;
      if(!dis) disponibles++;
      const detalle = listo ? (libres ? `Quedan ${libres} cupos` : 'Sin cupo') : `Aforo: ${z.aforo} personas`;
      return `<label class="z"><input type="radio" name="zona" value="${z.id}" ${dis?'disabled':''} ${!dis && pv === z.id ? 'checked' : ''}><span><i class="zi" aria-hidden="true">${z.i}</i>${z.n}<small>${detalle}</small></span></label>`;
    }).join('');
    $('hint').textContent = !listo ? 'Elige fecha, hora y cantidad de personas para ver las zonas.' :
      disponibles ? `${disponibles} ${disponibles>1?'zonas disponibles':'zona disponible'} para ${p} ${p>1?'personas':'persona'} el ${f.split('-').reverse().join('/')} a las ${hr}.` :
      'No hay zonas disponibles para esa selección. Prueba con otra hora o fecha.';
  }

  /* Eventos */
  $('celular').addEventListener('input', e => { e.target.value = e.target.value.replace(/\D/g, ''); });
  campos.forEach(c => {
    $(c).addEventListener('blur', () => validar(c));
    $(c).addEventListener('input', () => { if($(c).getAttribute('aria-invalid') === 'true') validar(c); });
  });
  ['fecha','hora','personas'].forEach(c => $(c).addEventListener('change', () => { if(c === 'fecha' && $('hora').value) validar('hora'); pintarZonas(); }));
  const mostrar = (id, t) => { const a = $(id); a.textContent = t; a.classList.add('show'); };
  const ocultar = id => $(id).classList.remove('show');
  const zonaSel = () => document.querySelector('input[name=zona]:checked');
  const nombreZona = () => ZONAS.find(z => z.id === zonaSel().value).n;
  const fila = (a, b) => `<dt>${a}</dt><dd>${b}</dd>`;
  const MSG3 = 'Una vez seleccionada la zona, confirma la reserva.';
  const datosOk = () => campos.every(c => !reglas[c]($(c).value));
  function bloquear(id, v){ const p = $(id); p.classList.toggle('locked', v); p.inert = v; }
  function bloquear3(){ bloquear('p3', true); $('confirmar').disabled = true; $('msg').textContent = MSG3; ocultar('alerta3'); }

  /* Paso 1 → 2: las zonas se habilitan cuando los datos son válidos */
  function actualizar(){
    const ok = datosOk();
    bloquear('p2', !ok);
    pintarZonas();
    if(!ok) $('hint').textContent = 'Completa los datos de la reserva para habilitar las zonas.';
    if(!ok || !zonaSel()) bloquear3();
  }
  $('form').addEventListener('input', actualizar);
  $('form').addEventListener('change', actualizar);
  $('zones').addEventListener('change', () => { ocultar('alerta2'); bloquear3(); });

  /* Paso 2 → 3: botón Continuar */
  $('continuar2').onclick = () => {
    ocultar('alerta2');
    if(!zonaSel()){
      mostrar('alerta2', document.querySelector('input[name=zona]:not(:disabled)') ? 'Selecciona una zona disponible para continuar.' : 'No hay zonas disponibles para esa selección. Cambia la fecha, la hora o la cantidad de personas.');
      return;
    }
    bloquear('p3', false); $('confirmar').disabled = false;
    $('msg').textContent = `Zona ${nombreZona()} seleccionada. Revisa tus datos y confirma la reserva.`;
    $('p3').scrollIntoView({behavior:'smooth', block:'center'});
  };

  /* Paso 3: confirmar */
  $('confirmar').onclick = () => {
    ocultar('alerta3');
    if(!validarTodo() || !zonaSel()){
      mostrar('alerta3', 'No se pudo confirmar: hay datos inválidos o falta seleccionar una zona.');
      return;
    }
    $('resumen').innerHTML = fila('Nombre', esc($('nombre').value.trim())) + fila('Celular', $('celular').value) +
      fila('Fecha', $('fecha').value.split('-').reverse().join('/')) + fila('Hora', $('hora').value) +
      fila('Personas', $('personas').value) + fila('Zona', nombreZona()) +
      ($('correo').value ? fila('Correo', esc($('correo').value.trim())) : '');
    $('ok').showModal();
  };
  $('nueva').onclick = () => {
    $('ok').close(); $('form').reset();
    campos.forEach(c => { $('e-'+c).textContent = ''; $(c).setAttribute('aria-invalid', 'false'); });
    ['alerta2','alerta3'].forEach(ocultar); actualizar(); window.scrollTo({top:0, behavior:'smooth'});
  };

  actualizar();
}


/* ===== Iniciar sesión (login.html) ===== */
function initLogin(){
  $('formLogin').addEventListener('submit', e => {
    e.preventDefault();
    let esValido = true;
    [['usuario','e-usuario'], ['clave','e-clave']].forEach(([campo, error]) => {
      if($(campo).value.trim() === ''){
        $(error).textContent = 'Este campo es obligatorio.';
        esValido = false;
      } else {
        $(error).textContent = '';
      }
    });
    if(!esValido) return;
    /* Al ser solo frontend, cualquier usuario/contraseña entra (no hay validación real) */
    location.href = 'establecimiento.html';
  });
}


/* ===== Gestionar información del establecimiento (establecimiento.html) ===== */
function initEstablecimiento(){
  const form = $('formInfo');
  const btnEditar = $('btnEditar'), btnCancelar = $('btnCancelar'), btnGuardar = $('btnGuardar');
  const alertaOk = $('alertaOk');
  const campos = form.querySelectorAll('input, textarea');
  const serviciosFieldset = $('servicios');
  const textos = ['nombreEst', 'direccion', 'telefono', 'horarios', 'descripcion'];
  let valoresOriginales = {};

  /* Bloquea o habilita todo el formulario */
  function modoEdicion(activo){
    campos.forEach(c => c.disabled = !activo);
    serviciosFieldset.disabled = !activo;
    btnCancelar.disabled = !activo;
    btnGuardar.disabled = !activo;
    btnEditar.disabled = activo;
  }

  /* "Editar información": guarda una copia de los valores y habilita los campos */
  btnEditar.addEventListener('click', () => {
    valoresOriginales = {};
    textos.forEach(id => { valoresOriginales[id] = $(id).value; });
    modoEdicion(true);
    alertaOk.hidden = true;
  });

  /* "Cancelar": devuelve los valores originales y vuelve a bloquear */
  btnCancelar.addEventListener('click', () => {
    textos.forEach(id => { $(id).value = valoresOriginales[id]; });
    form.querySelectorAll('.err').forEach(p => p.textContent = '');
    modoEdicion(false);
  });

  /* "Guardar cambios": valida campos obligatorios y formato de imágenes */
  form.addEventListener('submit', e => {
    e.preventDefault();
    let esValido = true;

    textos.forEach(id => {
      const error = $('e-' + id);
      if($(id).value.trim() === ''){
        error.textContent = 'Este campo es obligatorio.';
        esValido = false;
      } else {
        error.textContent = '';
      }
    });

    const galeria = $('galeria'), errorGaleria = $('e-galeria');
    const formatosValidos = ['image/jpeg', 'image/png', 'image/webp'];
    if(galeria.files.length > 0){
      const hayInvalidos = Array.from(galeria.files).some(a => !formatosValidos.includes(a.type));
      if(hayInvalidos){
        errorGaleria.textContent = 'Formato no válido. Usa JPG, PNG o WEBP.';
        esValido = false;
      } else {
        errorGaleria.textContent = '';
      }
    }

    if(!esValido) return;
    modoEdicion(false);
    alertaOk.hidden = false;
  });
}


/* ===== Gestionar carta gastronómica (carta-admin.html) ===== */
function initCartaAdmin(){
  const catsFilter = $('catsFilter'), listaPlatos = $('listaPlatos');
  const alertaOk = $('alertaMenuOk'), alertaErr = $('alertaMenuErr');
  const formNuevo = $('formNuevoPlato'), npCategoria = $('npCategoria');
  let categoriaActiva = 'todas';
  const fotosPendientes = {};   // fotos elegidas que aún no se han guardado

  const mostrarError = t => { alertaErr.textContent = t; alertaErr.classList.add('show'); };
  const ocultarAlertas = () => { alertaOk.hidden = true; alertaErr.classList.remove('show'); };

  /* Filtro por categoría */
  function renderFiltro(){
    catsFilter.innerHTML = ['todas', ...CATS.map(c => c.n)].map(nombre =>
      `<button type="button" data-cat="${nombre}" aria-pressed="${nombre === categoriaActiva}">${nombre === 'todas' ? 'Todas' : nombre}</button>`).join('');
  }
  catsFilter.addEventListener('click', e => {
    const btn = e.target.closest('button[data-cat]');
    if(!btn) return;
    categoriaActiva = btn.dataset.cat;
    renderFiltro();
    renderLista();
  });

  /* Lista de platos con precio, disponibilidad y foto editables */
  function renderLista(){
    const categorias = categoriaActiva === 'todas' ? CATS : CATS.filter(c => c.n === categoriaActiva);
    listaPlatos.innerHTML = categorias.map(cat => `
      <div class="cat-group">
        <h3>${cat.n}</h3>
        ${cat.items.map((item, idx) => `
          <div class="plato-row">
            <div class="nombre">
              ${item.img ? `<img src="${item.img}" alt="" class="plato-thumb">` : ''}
              <span>${item.e} ${esc(item.n)}</span>
              <input type="file" accept="image/*" class="plato-foto-input" data-cat="${cat.n}" data-idx="${idx}" aria-label="Cambiar foto de ${esc(item.n)}">
            </div>
            <input class="ctl" type="number" min="0" step="500" value="${item.p}" data-cat="${cat.n}" data-idx="${idx}" data-field="precio" aria-label="Precio de ${esc(item.n)}">
            <label class="chk">
              <input type="checkbox" ${item.disp ? 'checked' : ''} data-cat="${cat.n}" data-idx="${idx}" data-field="disp" aria-label="Disponible: ${esc(item.n)}">
              Disponible
            </label>
          </div>`).join('')}
      </div>`).join('');
  }

  /* Vista previa inmediata al elegir una foto nueva para un plato existente */
  listaPlatos.addEventListener('change', async e => {
    const input = e.target.closest('.plato-foto-input');
    if(!input || !input.files[0]) return;
    try{
      const base64 = await leerImagen(input.files[0]);
      fotosPendientes[input.dataset.cat + '|' + input.dataset.idx] = base64;
      const fila = input.closest('.plato-row');
      let thumb = fila.querySelector('.plato-thumb');
      if(!thumb){
        thumb = document.createElement('img');
        thumb.className = 'plato-thumb';
        thumb.alt = '';
        fila.querySelector('.nombre').prepend(thumb);
      }
      thumb.src = base64;
    }catch(err){
      mostrarError('No se pudo leer la imagen. Prueba con otra.');
    }
  });

  /* "Guardar cambios": valida precios, actualiza CATS y guarda en el navegador */
  $('btnGuardarMenu').addEventListener('click', () => {
    ocultarAlertas();

    let hayError = false;
    listaPlatos.querySelectorAll('input[data-field="precio"]').forEach(input => {
      const valor = Number(input.value);
      if(input.value.trim() === '' || isNaN(valor) || valor < 0){
        input.setAttribute('aria-invalid', 'true');
        hayError = true;
      } else {
        input.removeAttribute('aria-invalid');
      }
    });
    if(hayError){
      mostrarError('Hay precios inválidos. Revisa los campos marcados en rojo.');
      return;
    }

    const overrides = leerLS('menuOverrides', {});
    listaPlatos.querySelectorAll('.plato-row').forEach(fila => {
      const inputPrecio = fila.querySelector('input[data-field="precio"]');
      const inputDisp = fila.querySelector('input[data-field="disp"]');
      const catNombre = inputPrecio.dataset.cat;
      const idx = Number(inputPrecio.dataset.idx);
      const item = CATS.find(c => c.n === catNombre).items[idx];

      item.p = Number(inputPrecio.value);
      item.disp = inputDisp.checked;
      const foto = fotosPendientes[catNombre + '|' + idx];
      if(foto) item.img = foto;

      overrides[catNombre + '|' + item.n] = {p: item.p, disp: item.disp, img: item.img};
    });

    if(!guardarLS('menuOverrides', overrides)){
      mostrarError('No se pudo guardar: el navegador se quedó sin espacio. Usa fotos más pequeñas.');
      return;
    }
    Object.keys(fotosPendientes).forEach(k => delete fotosPendientes[k]);
    alertaOk.hidden = false;
  });

  /* Agregar nuevo plato */
  npCategoria.innerHTML = CATS.map(c => `<option value="${c.n}">${c.n}</option>`).join('');

  formNuevo.addEventListener('submit', async e => {
    e.preventDefault();
    const nombre = $('npNombre'), descripcion = $('npDescripcion'), precio = $('npPrecio');
    let esValido = true;

    [['npNombre', nombre], ['npDescripcion', descripcion]].forEach(([id, campo]) => {
      $('e-' + id).textContent = campo.value.trim() === '' ? 'Este campo es obligatorio.' : '';
      if(campo.value.trim() === '') esValido = false;
    });

    const valorPrecio = Number(precio.value);
    if(precio.value.trim() === '' || isNaN(valorPrecio) || valorPrecio <= 0){
      $('e-npPrecio').textContent = 'Ingresa un precio válido mayor a 0.';
      esValido = false;
    } else {
      $('e-npPrecio').textContent = '';
    }

    const categoria = CATS.find(c => c.n === npCategoria.value);
    if(nombre.value.trim() !== '' && categoria.items.some(it => it.n.toLowerCase() === nombre.value.trim().toLowerCase())){
      $('e-npNombre').textContent = 'Ya existe un plato con ese nombre en esta categoría.';
      esValido = false;
    }
    if(!esValido) return;

    let img = '';
    const archivo = $('npFoto').files[0];
    if(archivo){
      try{ img = await leerImagen(archivo); }
      catch(err){ $('e-npFoto').textContent = 'No se pudo leer la imagen. Prueba con otra.'; return; }
    }
    $('e-npFoto').textContent = '';

    const plato = {n: nombre.value.trim(), d: descripcion.value.trim(), p: valorPrecio, e: '🍽️', h: 30, img, disp: true};
    const nuevos = leerLS('menuNuevos', []);
    nuevos.push({cat: npCategoria.value, plato});
    if(!guardarLS('menuNuevos', nuevos)){
      $('e-npFoto').textContent = 'No se pudo guardar: el navegador se quedó sin espacio. Usa una foto más pequeña.';
      return;
    }

    categoria.items.push(plato);
    formNuevo.reset();
    renderFiltro();
    renderLista();
  });

  renderFiltro();
  renderLista();
}


/* ---------- 5. Arranque ---------- */
const PAGINAS = {
  inicio: initInicio,
  menu: initMenu,
  reservas: initReservas,
  login: initLogin,
  establecimiento: initEstablecimiento,
  'carta-admin': initCartaAdmin
};

initNav();
const arrancar = PAGINAS[document.body.dataset.page];
if(arrancar) arrancar();
