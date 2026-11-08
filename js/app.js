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

/* Información del establecimiento: valores por defecto + lo que guarde el administrador */
const INFO_BASE = {
  nombreEst: 'Buen Sabor',
  direccion: 'Cra 12 # 45-67, Bucaramanga',
  telefono: '3001234567',
  horarios: 'Lunes - Viernes: 10:00 a. m. - 10:00 p. m.; Sábado: 10:00 a. m. - 11:00 p. m.; Domingo: 10:00 a. m. - 9:00 p. m.',
  descripcion: 'Buen Sabor es un restaurante de comida, postres y bebidas, donde buscamos ofrecer el mejor sabor en cada momento. Contamos con un ambiente familiar, ideal para compartir con familia, amigos y disfrutar un buen momento.',
  servicios: ['wifi', 'domicilios', 'terraza', 'mascotas']
};
function leerInfo(){ return Object.assign({}, INFO_BASE, leerLS('infoEstablecimiento', {})); }

/* ¿Está abierto ahora? Lee el texto de horarios y usa la hora de Colombia.
   Devuelve null si no entiende el texto (entonces no se muestra el aviso). */
function estadoHorario(texto, ahora = new Date()){
  const DIAS = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];
  const NOMBRES = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const sin = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const aMin = (h, m, ap) => ((+h % 12) + (ap === 'p' ? 12 : 0)) * 60 + +m;
  const franjas = {};
  texto.split(';').forEach(parte => {
    const m = parte.match(/^(.*?):\s*(\d{1,2}):(\d{2})\s*([ap])\.?\s*m\.?\s*[-–a]+\s*(\d{1,2}):(\d{2})\s*([ap])\.?\s*m\.?/i);
    if(!m) return;
    const dias = DIAS.map((d, i) => sin(m[1]).includes(d) ? i : -1).filter(i => i >= 0);
    if(!dias.length) return;
    let lista = dias;
    if(dias.length === 2 && /(-|–|\ba\b)/.test(m[1])){
      lista = []; for(let d = dias[0]; ; d = (d + 1) % 7){ lista.push(d); if(d === dias[1]) break; }
    }
    const f = {ab: aMin(m[2], m[3], m[4].toLowerCase()), ce: aMin(m[5], m[6], m[7].toLowerCase()),
               abTxt: `${m[2]}:${m[3]} ${m[4].toLowerCase()}. m.`, ceTxt: `${m[5]}:${m[6]} ${m[7].toLowerCase()}. m.`};
    lista.forEach(d => franjas[d] = f);
  });
  if(!Object.keys(franjas).length) return null;

  const p = new Intl.DateTimeFormat('en-US', {timeZone: 'America/Bogota', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false}).formatToParts(ahora);
  const get = t => p.find(x => x.type === t).value;
  const dia = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(get('weekday'));
  const min = (+get('hour') % 24) * 60 + +get('minute');

  const hoy = franjas[dia];
  if(hoy){
    const cierre = hoy.ce <= hoy.ab ? hoy.ce + 1440 : hoy.ce;
    if(min >= hoy.ab && min < cierre) return {abierto: true, texto: `Abierto ahora · cierra a las ${hoy.ceTxt}`};
  }
  const ayer = franjas[(dia + 6) % 7];
  if(ayer && ayer.ce <= ayer.ab && min < ayer.ce) return {abierto: true, texto: `Abierto ahora · cierra a las ${ayer.ceTxt}`};

  for(let k = 0; k < 7; k++){
    const d = (dia + k) % 7, f = franjas[d];
    if(!f || (k === 0 && min >= f.ab)) continue;
    const cuando = k === 0 ? 'hoy' : k === 1 ? 'mañana' : 'el ' + NOMBRES[d];
    return {abierto: false, texto: `Cerrado ahora · abre ${cuando} a las ${f.abTxt}`};
  }
  return {abierto: false, texto: 'Cerrado ahora'};
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
  {n:'Entradas',i:'<svg viewBox="0 0 24 24"><path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z"/><path d="M7 21h10"/><path d="M19.5 12 22 6"/><path d="M16.25 3c.27.1.8.53.75 1.36-.06.83-.93 1.2-1 2.02-.05.78.34 1.24.73 1.62"/><path d="M11.25 3c.27.1.8.53.74 1.36-.05.83-.93 1.2-.98 2.02-.06.78.33 1.24.72 1.62"/><path d="M6.25 3c.27.1.8.53.75 1.36-.06.83-.93 1.2-1 2.02-.05.78.34 1.24.74 1.62"/></svg>',c:'var(--c1)',items:[
  {n:'Empanadas colombianas',d:'Rellenas de carne y papa, con ají casero.',p:7000,e:'🥟',h:38,img:'img/empanadas.jpg',disp:true},
  {n:'Patacones con hogao',d:'Plátano verde frito con hogao y queso rallado.',p:8000,e:'🍌',h:50,img:'img/patacones.jpg',disp:true},
  {n:'Arepa con queso',d:'Arepa de maíz asada con queso campesino derretido.',p:6000,e:'🌽',h:45,img:'img/arepa-queso.jpg',disp:true},
  {n:'Chicharrón crocante',d:'Trozos de cerdo fritos, con limón y arepita.',p:9500,e:'🥓',h:25,img:'img/chicharron.jpg',disp:true},
  {n:'Bolitas de yuca',d:'Fritas y rellenas de queso, con suero costeño.',p:7500,e:'🧀',h:42,img:'img/bolitas-yuca.jpg',disp:true},
  {n:'Deditos de queso',d:'Palitos de masa con queso, fritos y dorados.',p:7000,e:'🧆',h:35,img:'img/deditos-queso.jpg',disp:true},
  {n:'Chorizo santarrosano',d:'Chorizo a la parrilla con arepita y limón.',p:8500,e:'🌭',h:15,img:'img/chorizo.jpg',disp:true},
  {n:'Caldo de costilla',d:'Caldo casero con papa, cilantro y arepa.',p:8000,e:'🍲',h:30,img:'img/caldo-costilla.jpg',disp:true}]},
  {n:'Platos fuertes',i:'<svg viewBox="0 0 24 24"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>',c:'var(--c2)',items:[
  {n:'Bandeja paisa',d:'Frijoles, arroz, chicharrón, carne, huevo y plátano.',p:28000,e:'🍛',h:30,img:'img/bandeja-paisa.jpg',disp:true},
  {n:'Ajiaco santafereño',d:'Sopa de tres papas con pollo, mazorca, alcaparras y crema.',p:26000,e:'🥣',h:45,img:'img/ajiaco.jpg',disp:true},
  {n:'Sancocho de gallina',d:'Caldo con gallina, yuca, plátano y mazorca, con arroz.',p:25000,e:'🍲',h:35,img:'img/sancocho.jpg',disp:true},
  {n:'Sobrebarriga criolla',d:'En salsa criolla, con arroz, papa y ensalada.',p:27000,e:'🥩',h:10,img:'img/sobrebarriga.jpg',disp:true},
  {n:'Mojarra frita',d:'Con arroz de coco, patacón y ensalada fresca.',p:30000,e:'🐟',h:15,img:'img/mojarra.jpg',disp:true},
  {n:'Lechona tolimense',d:'Cerdo relleno de arroz y arvejas, con arepa.',p:24000,e:'🍖',h:28,img:'img/lechona.jpg',disp:true},
  {n:'Pollo guisado',d:'Pollo en salsa criolla, con arroz y papa.',p:23000,e:'🍗',h:22,img:'img/pollo-guisado.jpg',disp:true},
  {n:'Carne asada con papa criolla',d:'Corte de res a la parrilla con papa criolla y ensalada.',p:29000,e:'🥓',h:5,img:'img/carne-asada.jpg',disp:true}]},
  {n:'Bebidas',i:'<svg viewBox="0 0 24 24"><path d="m6 8 1.75 12.28a2 2 0 0 0 2 1.72h4.54a2 2 0 0 0 2-1.72L18 8"/><path d="M5 8h14"/><path d="M7 15a6.47 6.47 0 0 1 5 0 6.47 6.47 0 0 0 5 0"/><path d="m12 8 1-6h2"/></svg>',c:'var(--c3)',items:[
  {n:'Limonada de coco',d:'Refrescante, con leche de coco y hielo.',p:9000,e:'🥥',h:190,img:'img/limonada-coco.jpg',disp:true},
  {n:'Jugo de lulo',d:'Natural, preparado en agua o en leche.',p:7000,e:'🍹',h:75,img:'img/jugo-lulo.jpg',disp:true},
  {n:'Café de origen',d:'Grano santandereano, servido caliente.',p:5000,e:'☕',h:25,img:'img/cafe.jpg',disp:true},
  {n:'Jugo de mora',d:'Mora de Castilla natural, en agua o leche.',p:6500,e:'🫐',h:280,img:'img/jugo-mora.jpg',disp:true},
  {n:'Jugo de maracuyá',d:'Natural, ácido y refrescante.',p:7000,e:'🥭',h:48,img:'img/jugo-maracuya.jpg',disp:true},
  {n:'Agua de panela con limón',d:'Bebida tradicional, fría o caliente.',p:4500,e:'🍋',h:55,img:'img/aguapanela.jpg',disp:true},
  {n:'Chocolate con queso',d:'Chocolate caliente santafereño con queso.',p:7000,e:'🍫',h:20,img:'img/chocolate.jpg',disp:true},
  {n:'Avena fría',d:'Bebida casera de avena con canela.',p:6000,e:'🥛',h:210,img:'img/avena.jpg',disp:true}]},
  {n:'Postres',i:'<svg viewBox="0 0 24 24"><path d="M16 13H3"/><path d="M16 17H3"/><path d="m7.2 7.9-3.388 2.5A2 2 0 0 0 3 12.01V20a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-8.654c0-2-2.44-6.026-6.44-8.026a1 1 0 0 0-1.082.057L10.4 5.6"/><circle cx="9" cy="7" r="2"/></svg>',c:'var(--c4)',items:[
  {n:'Arroz con leche',d:'Receta casera con canela y pasas.',p:5500,e:'🥣',h:40,img:'img/arroz-leche.jpg',disp:true},
  {n:'Natilla con buñuelos',d:'Natilla de canela con buñuelos calientes.',p:7500,e:'🍮',h:35,img:'img/natilla.jpg',disp:true},
  {n:'Obleas con arequipe',d:'Obleas crocantes con arequipe y queso.',p:6000,e:'🍪',h:32,img:'img/obleas.jpg',disp:true},
  {n:'Brevas con arequipe',d:'Brevas en almíbar con arequipe y queso.',p:7000,e:'🍯',h:28,img:'img/brevas.jpg',disp:true},
  {n:'Postre de natas',d:'Dulce casero de natas con canela.',p:6500,e:'🍰',h:45,img:'img/natas.jpg',disp:true},
  {n:'Cuajada con melao',d:'Cuajada fresca con miel de caña.',p:6500,e:'🧀',h:50,img:'img/cuajada.jpg',disp:true},
  {n:'Tres leches',d:'Bizcocho húmedo con crema y canela.',p:7500,e:'🧁',h:340,img:'img/tres-leches.jpg',disp:true},
  {n:'Helado de coco',d:'Helado artesanal de coco con coco rallado.',p:7000,e:'🍦',h:330,img:'img/helado-coco.jpg',disp:true}]}
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
    if(c.d !== undefined) item.d = c.d;
  }));
})();

/* ---------- Reservas y bloqueos (los comparten "Reserva de mesa" y "Agenda y aforo") ---------- */
/* Zonas del restaurante y su aforo (personas que caben en cada una) */
const ZONAS = [
  {id:'salon',   n:'Salón',   i:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>', aforo:40},
  {id:'terraza', n:'Terraza', i:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12a10.06 10.06 1 0 0-20 0Z"/><path d="M12 12v8a2 2 0 0 0 4 0"/><path d="M12 2v1"/></svg>', aforo:20},
  {id:'barra',   n:'Barra',   i:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 22h8"/><path d="M7 10h10"/><path d="M12 15v7"/><path d="M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z"/></svg>', aforo:8}
];
/* Franjas horarias: de 12:00 a 21:00, cada 30 minutos */
const HORAS = [];
for(let m = 12*60; m <= 21*60; m += 30) HORAS.push(String(Math.floor(m/60)).padStart(2,'0') + ':' + (m % 60 ? '30' : '00'));

const getReservas = () => leerLS('reservas', []);
const getBloqueos = () => leerLS('bloqueos', []);
/* Reservas que ocupan lugar (las canceladas no cuentan) */
const activas = (zona, fecha, hora) => getReservas().filter(r => r.estado !== 'Cancelada' && r.zona === zona && r.fecha === fecha && r.hora === hora);
const personasEn = (zona, fecha, hora) => activas(zona, fecha, hora).reduce((t, r) => t + r.personas, 0);
const estaBloqueada = (zona, fecha, hora) => getBloqueos().some(b => b.zona === zona && b.fecha === fecha && b.hora === hora);

function registrarReserva(datos){
  const reservas = getReservas();
  reservas.push({...datos, id: Date.now(), estado: 'Confirmada'});
  return guardarLS('reservas', reservas);
}
function cambiarEstadoReserva(id, estado){
  const reservas = getReservas();
  const r = reservas.find(x => x.id === id);
  if(r) r.estado = estado;
  return guardarLS('reservas', reservas);
}
function bloquearFranja(zona, fecha, hora){
  if(estaBloqueada(zona, fecha, hora)) return true;
  const bloqueos = getBloqueos();
  bloqueos.push({zona, fecha, hora});
  return guardarLS('bloqueos', bloqueos);
}
function habilitarFranja(zona, fecha, hora){
  return guardarLS('bloqueos', getBloqueos().filter(b => !(b.zona === zona && b.fecha === fecha && b.hora === hora)));
}


/* ---------- 3. Navegación compartida ---------- */
function initNav(){
  /* Botón "Iniciar Sesión" (páginas públicas) */
  const login = $('btnLogin');
  if(login) login.addEventListener('click', () => { location.href = sessionStorage.getItem('admin') === '1' ? 'establecimiento.html' : 'login.html'; });

    /* Botón ☰ del menú en pantallas pequeñas */
  const toggle = $('navToggle');
  if(toggle) toggle.addEventListener('click', () => {
    const abierto = $('navMenu').classList.toggle('abierto');
    toggle.setAttribute('aria-expanded', String(abierto));
  });

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
    if(salir) salir.addEventListener('click', e => { e.preventDefault(); sessionStorage.removeItem('admin'); location.href = 'menu.html'; });
  }
}

/* ---------- Barra de navegación: se dibuja desde aquí para todas las páginas ---------- */
const PAGINAS_ADMIN = ['establecimiento', 'carta-admin', 'agenda'];

function renderNav(){
  const header = document.querySelector('header.top');
  if(!header) return;
  const pagina = document.body.dataset.page;
  const marca = '<div class="logo"><img src="img/logo.png" alt="Logo Buen Sabor" class="logo-img"></div><span class="brand">Buen Sabor</span>';

  if(pagina === 'login'){
    header.innerHTML = `<nav class="nav" aria-label="Principal">${marca}</nav>`;
    return;
  }
  const admin = PAGINAS_ADMIN.includes(pagina);
  const item = (id, href, texto) => pagina === id
    ? `<li><a href="${href}" aria-current="page">${texto}</a></li>`
    : `<li><a href="${href}">${texto}</a></li>`;

  /* Cliente: Inicio, Menú, Reservas, Contacto + "Iniciar sesión".
     Administrador: solo sus opciones, con otro color y una etiqueta "Administración". */
  const enlaces = admin
    ? item('agenda', 'agenda.html', 'Agenda y aforo') + item('carta-admin', 'carta-admin.html', 'Carta')
      + item('establecimiento', 'establecimiento.html', 'Establecimiento') + '<li><a href="inicio.html">Ver sitio</a></li>'
    : item('inicio', 'inicio.html', 'Inicio') + item('menu', 'menu.html', 'Menú')
      + item('reservas', 'index.html', 'Reservas') + '<li><a href="inicio.html#t-cont">Contacto</a></li>';
  const iconoUsuario = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></svg>';
  const sesion = admin
    ? `<div class="dropdown">
        <button class="btn-dropdown login" type="button" id="btnUserMenu" aria-haspopup="true" aria-expanded="false">${iconoUsuario}Administrador ▾</button>
        <ul class="dropdown-menu" id="userMenu" hidden><li><a href="#" id="btnLogout">Cerrar sesión</a></li></ul>
      </div>`
    : `<button class="btn login" type="button" id="btnLogin">${sessionStorage.getItem('admin') === '1' ? 'Volver al panel' : 'Iniciar sesión'}</button>`;

  header.innerHTML = `<nav class="nav${admin ? ' nav-admin' : ''}" aria-label="${admin ? 'Administración' : 'Principal'}">${marca}${admin ? '<span class="badge-admin">Administración</span>' : ''}
    <button class="nav-toggle" type="button" id="navToggle" aria-expanded="false" aria-controls="navMenu" aria-label="Abrir o cerrar el menú">☰</button>
    <div class="nav-menu" id="navMenu"><ul>${enlaces}</ul>${sesion}</div>
  </nav>`;
}

/* ---------- 4. Páginas ---------- */

/* ===== Inicio (inicio.html): carrusel de la galería ===== */
function initInicio(){

  const info = leerInfo();
  const q = sel => document.querySelector(sel);
  q('#t-info + p').textContent = info.descripcion;
  const tel = q('a[href^="tel:"]');
  tel.textContent = info.telefono.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  tel.href = 'tel:+57' + info.telefono.replace(/\D/g, '');
  q('#btnLlamar').href = tel.href;
  q('#btnWsp').href = 'https://wa.me/57' + info.telefono.replace(/\D/g, '');
  q('.hrs').innerHTML = info.horarios.split(';').map(t => {
    const m = t.trim().match(/^(.*?):\s*(\d.*)$/);
    return m ? `<li><b>${esc(m[1])}</b><span>${esc(m[2])}</span></li>` : `<li><b>${esc(t.trim())}</b></li>`;
  }).join('');

  /* Aviso "Abierto ahora / Cerrado": se actualiza cada minuto */
  const estadoEl = q('#estadoAbierto');
   /* Marca en la lista de horarios la fila del día de hoy (hora de Colombia) */
  const marcarHoy = () => {
    const DIAS = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];
    const sin = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const nombreHoy = new Intl.DateTimeFormat('en-US', {timeZone: 'America/Bogota', weekday: 'short'}).format(new Date());
    const hoy = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(nombreHoy);
    document.querySelectorAll('.hrs li').forEach(li => {
      const txt = sin(li.querySelector('b').textContent);
      const dias = DIAS.map((d, i) => txt.includes(d) ? i : -1).filter(i => i >= 0);
      let lista = dias;
      if(dias.length === 2 && /(-|–|\ba\b)/.test(txt)){
        lista = []; for(let d = dias[0]; ; d = (d + 1) % 7){ lista.push(d); if(d === dias[1]) break; }
      }
      li.classList.toggle('hoy', lista.includes(hoy));
    });
  };
  const pintarEstado = () => {
    marcarHoy();
    const e = estadoHorario(info.horarios);
    estadoEl.hidden = !e;
    if(e){ estadoEl.textContent = e.texto; estadoEl.className = 'estado-abierto ' + (e.abierto ? 'abierto' : 'cerrado'); }
  };
  pintarEstado();
  setInterval(pintarEstado, 60000);
  q('.direccion').textContent = info.direccion;
  q('a.mapa svg').setAttribute('preserveAspectRatio', 'xMidYMid slice');
  q('a.mapa').href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(info.direccion);
  document.querySelectorAll('.chips li').forEach(li => {
    const txt = li.textContent.trim().toLowerCase();
    const clave = [['wifi','wifi'], ['domicilios','domicilios'], ['terraza','terraza'], ['pet','mascotas']].find(([t]) => txt.includes(t))?.[1];
    li.style.display = (!clave || info.servicios.includes(clave)) ? '' : 'none';
  });
  
  /* img: ruta de una foto real (ej. 'img/salon.jpg'). Si está vacío se muestra el emoji. */
  const SLIDES = [
    {t:'Mesa servida',  e:'🍽️', h:30,  img:'img/galeria-1.jpg'},
    {t:'Nuestro salón', e:'🪑', h:20,  img:'img/galeria-2.jpg'},
    {t:'Terraza',       e:'🌿', h:110, img:'img/galeria-3.jpg'},
    {t:'La barra',      e:'☕', h:35,  img:'img/galeria-4.jpg'},
    {t:'Fachada',       e:'🏠', h:15,  img:'img/galeria-5.jpg'},
    {t:'Postres',       e:'🍰', h:45,  img:'img/galeria-6.jpg'}
  ];

  const fotosGuardadas = leerLS('infoGaleria', []);
  if(fotosGuardadas.length) SLIDES.splice(0, SLIDES.length, ...fotosGuardadas.map((src, k) => ({t:'Foto ' + (k+1), e:'', h:10, img:src})));

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
  const pic = x => x.img ? `<img src="${x.img}" alt="${esc(x.n)}" onerror="this.outerHTML='<span aria-hidden=&quot;true&quot;>${x.e}</span>'">` : `<span aria-hidden="true">${x.e}</span>`;
  let activa = 0;

  $('cats').innerHTML = CATS.map((c,k) => `<button class="cat" type="button" style="--cat:${c.c}" data-k="${k}" aria-pressed="false"><span class="ci" aria-hidden="true">${c.i}</span>${c.n}</button>`).join('');

  function render(lista, titulo, vacio = 'No hay platos disponibles en esta categoría por ahora.'){
    $('tit').textContent = titulo;
    $('cards').className = 'cards'; void $('cards').offsetWidth; $('cards').className = 'cards fade';
    $('cards').innerHTML = lista.length ? lista.map(({x,c,k,j}, i) => `<article class="card" style="--cat:${c.c};animation-delay:${Math.min(i,12)*.05}s">
      <div class="img" style="${bg(x.h)}">${pic(x)}</div>
      <h3>${esc(x.n)}</h3><p class="price">${fmt(x.p)}</p>
      <button class="btn ghost" type="button" data-k="${k}" data-j="${j}">Ver detalle</button></article>`).join('') : `<p class="empty">${vacio}</p>`;
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
    const b = e.target.closest('button[data-k]') || (e.target.closest('.img') && e.target.closest('.card').querySelector('button[data-k]'));
    if(!b) return;
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
   /* Cupo real de cada zona: aforo menos las reservas hechas (0 si el Administrador bloqueó la franja) */
  function lugaresLibres(z, f, hr){
    return estaBloqueada(z.id, f, hr) ? 0 : z.aforo - personasEn(z.id, f, hr);
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
      const detalle = listo ? (estaBloqueada(z.id, f, hr) ? 'No disponible' : libres ? `Quedan ${libres} cupos` : 'Sin cupo') : `Aforo: ${z.aforo} personas`;
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
    const zona = ZONAS.find(z => z.id === zonaSel().value), personas = +$('personas').value;
    if(lugaresLibres(zona, $('fecha').value, $('hora').value) < personas){
      mostrar('alerta3', 'Esa zona ya no tiene cupo para ese horario. Elige otra zona o cambia la hora.');
      actualizar();
      return;
    }
    registrarReserva({nombre: $('nombre').value.trim(), celular: $('celular').value, correo: $('correo').value.trim(),
      personas, fecha: $('fecha').value, hora: $('hora').value, zona: zona.id});
      
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
    sessionStorage.setItem('admin', '1');
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

  const info = leerInfo();
  textos.forEach(id => { $(id).value = info[id]; });
  form.querySelectorAll('input[name="servicios"]').forEach(c => { c.checked = info.servicios.includes(c.value); });

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
  form.addEventListener('submit', async e => {
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

    if(galeria.files.length > 6){
      errorGaleria.textContent = 'Máximo 6 imágenes.';
      esValido = false;
    }

    if(!esValido) return;
    if(galeria.files.length > 0){
      const fotos = await Promise.all(Array.from(galeria.files).map(a => leerImagen(a)));
      if(!guardarLS('infoGaleria', fotos)){
        errorGaleria.textContent = 'Las imágenes pesan demasiado. Sube menos o más livianas.';
        return;
      }
    }
    const nuevo = {};

    textos.forEach(id => { nuevo[id] = $(id).value.trim(); });
    nuevo.servicios = Array.from(form.querySelectorAll('input[name="servicios"]:checked')).map(c => c.value);
    guardarLS('infoEstablecimiento', nuevo);
    modoEdicion(false);
    alertaOk.hidden = false;
  });
}


/* ===== Gestionar carta gastronómica (carta-admin.html) ===== */
function initCartaAdmin(){
  const catsFilter = $('catsFilter'), listaPlatos = $('listaPlatos');
  const formNuevo = $('formNuevoPlato'), npCategoria = $('npCategoria');
  let categoriaActiva = 'todas';
  const fmt = p => '$ ' + p.toLocaleString('es-CO');

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

   /* Lista de platos: foto, nombre, precio, estado y botón Editar */
  function renderLista(){
    const categorias = categoriaActiva === 'todas' ? CATS : CATS.filter(c => c.n === categoriaActiva);
    listaPlatos.innerHTML = categorias.map(cat => `
      <div class="cat-group">
        <h3>${cat.n}</h3>
        ${cat.items.map((item, idx) => `
          <div class="plato-row" data-cat="${cat.n}" data-idx="${idx}">
            <div class="nombre">
              ${item.img ? `<img src="${item.img}" alt="" class="plato-thumb">` : `<span class="plato-thumb sin-foto" aria-hidden="true"></span>`}
              <span>${esc(item.n)}</span>
            </div>
            <span class="precio-fila">${fmt(item.p)}</span>
            <span class="etiqueta ${item.disp ? 'ok' : 'bloqueada'}">${item.disp ? 'Disponible' : 'Agotado'}</span>
            <button class="btn btn-sm" type="button" data-editar>
              <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>Editar
            </button>
          </div>`).join('')}
      </div>`).join('');
  }

  /* Ventana "Editar plato" */
  const dlg = $('dlgEditar'), edImg = $('edImg'), edEmoji = $('edEmoji'), edErr = $('edErr');
  let platoEnEdicion = null, fotoNueva = null;

  function mostrarFoto(src){
    edImg.hidden = !src; edEmoji.hidden = !!src;
    if(src) edImg.src = src;
  }
  listaPlatos.addEventListener('click', e => {
    const fila = e.target.closest('.plato-row');
    if(!fila) return;
    const cat = CATS.find(c => c.n === fila.dataset.cat);
    platoEnEdicion = {cat, item: cat.items[Number(fila.dataset.idx)]};
    fotoNueva = null;
    const it = platoEnEdicion.item;
    $('edTitulo').textContent = it.n;
    $('edCategoria').textContent = cat.n;
    $('edDesc').value = it.d || '';
    $('edPrecio').value = it.p;
    $('edDisp').checked = it.disp;
    edErr.textContent = '';
    mostrarFoto(it.img);
    dlg.showModal();
  });
  dlg.addEventListener('click', e => { if(e.target === dlg) dlg.close(); });
  $('edCancelar').addEventListener('click', () => dlg.close());
  $('btnFoto').addEventListener('click', () => $('edFoto').click());

  /* Vista previa inmediata al elegir una foto nueva */
  $('edFoto').addEventListener('change', async e => {
    const archivo = e.target.files[0];
    if(!archivo) return;
    try{
      fotoNueva = await leerImagen(archivo);
      mostrarFoto(fotoNueva);
      edErr.textContent = '';
    }catch(err){
      edErr.textContent = 'No se pudo leer la imagen. Prueba con otra.';
    }
    e.target.value = '';
  });

  /* "Guardar cambios": valida y guarda en el navegador */
  $('formEditar').addEventListener('submit', e => {
    e.preventDefault();
    const desc = $('edDesc').value.trim(), precioTxt = $('edPrecio').value.trim(), precio = Number(precioTxt);
    if(desc === ''){ edErr.textContent = 'La descripción es obligatoria.'; return; }
    if(precioTxt === '' || isNaN(precio) || precio < 0){ edErr.textContent = 'Ingresa un precio válido.'; return; }

    const {cat, item} = platoEnEdicion;
    const overrides = leerLS('menuOverrides', {});
    overrides[cat.n + '|' + item.n] = {p: precio, disp: $('edDisp').checked, img: fotoNueva || item.img, d: desc};
    if(!guardarLS('menuOverrides', overrides)){
      edErr.textContent = 'No se pudo guardar: el navegador se quedó sin espacio. Usa una foto más pequeña.';
      return;
    }
    item.p = precio; item.disp = $('edDisp').checked; item.d = desc;
    if(fotoNueva) item.img = fotoNueva;
    dlg.close();
    renderLista();
    toast('Plato actualizado');
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

/* ===== Gestionar agenda y aforo (agenda.html) ===== */
function initAgenda(){
  const filtro = $('filtroFecha'), dlg = $('dlgConfirmar');
  const fmtFecha = f => f.split('-').reverse().join('/');
  const nombreZona = id => ZONAS.find(z => z.id === id).n;
  const orden = (a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora);
  const hoy = new Date();
  const hoyISO = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}-${String(hoy.getDate()).padStart(2,'0')}`;

  /* Ventana de confirmación reutilizable: devuelve true si el Administrador acepta */
  function confirmar(titulo, mensaje, textoAceptar){
    return new Promise(resolve => {
      $('dcTitulo').textContent = titulo;
      $('dcMensaje').textContent = mensaje;
      $('dcAceptar').textContent = textoAceptar;
      let acepto = false;
      $('dcAceptar').onclick = () => { acepto = true; dlg.close(); };
      $('dcCancelar').onclick = () => dlg.close();
      dlg.addEventListener('close', () => resolve(acepto), {once: true});
      dlg.showModal();
    });
  }
  dlg.addEventListener('click', e => { if(e.target === dlg) dlg.close(); });

  /* Listado cronológico de reservas, con filtro opcional por fecha */
  function renderReservas(){
    let lista = getReservas().sort(orden);
    if(filtro.value) lista = lista.filter(r => r.fecha === filtro.value);
    $('listaReservas').innerHTML = lista.length ? lista.map(r => `
      <article class="reserva">
        <div class="flex items-start justify-between gap-2">
          <strong>${fmtFecha(r.fecha)} · ${r.hora}</strong>
          <span class="etiqueta ${r.estado.toLowerCase()}">${r.estado}</span>
        </div>
        <p>${esc(r.nombre)} · ${esc(r.celular)}</p>
        <p>${r.personas} ${r.personas > 1 ? 'personas' : 'persona'} · ${nombreZona(r.zona)}</p>
        ${r.estado === 'Confirmada' ? `<div class="flex flex-wrap gap-2 mt-3">
          <button class="btn amber btn-sm" type="button" data-accion="atender" data-id="${r.id}">Marcar atendida</button>
          <button class="btn btn-sm" type="button" data-accion="cancelar" data-id="${r.id}">Cancelar reserva</button>
        </div>` : ''}
      </article>`).join('')
      : `<p class="empty">${filtro.value ? 'No hay reservas para esa fecha.' : 'Todavía no hay reservas. Las que haga un Cliente aparecerán aquí.'}</p>`;
  }

  /* Franjas (fecha + hora + zona) que tienen reservas o están bloqueadas */
  function franjas(){
    const mapa = new Map();
    const agregar = x => { const k = x.fecha + '|' + x.hora + '|' + x.zona; if(!mapa.has(k)) mapa.set(k, {fecha: x.fecha, hora: x.hora, zona: x.zona}); };
    getReservas().filter(r => r.estado !== 'Cancelada').forEach(agregar);
    getBloqueos().forEach(agregar);
    let lista = [...mapa.values()].sort(orden);
    if(filtro.value) lista = lista.filter(x => x.fecha === filtro.value);
    return lista;
  }
  function renderFranjas(){
    const lista = franjas();
    $('listaFranjas').innerHTML = lista.length ? lista.map(x => {
      const z = ZONAS.find(z => z.id === x.zona);
      const ocupadas = personasEn(x.zona, x.fecha, x.hora);
      const bloqueada = estaBloqueada(x.zona, x.fecha, x.hora);
      const llena = ocupadas >= z.aforo;
      const estado = bloqueada ? ['bloqueada', 'Bloqueada'] : llena ? ['llena', 'Lleno'] : ['ok', 'Disponible'];
      return `<article class="franja ${llena ? 'llena' : ''}">
        <div class="flex items-start justify-between gap-2">
          <strong>${fmtFecha(x.fecha)} · ${x.hora} · ${z.n}</strong>
          <span class="etiqueta ${estado[0]}">${estado[1]}</span>
        </div>
        <p>${ocupadas} de ${z.aforo} personas</p>
        <div class="barra" role="progressbar" aria-label="Ocupación" aria-valuemin="0" aria-valuemax="${z.aforo}" aria-valuenow="${ocupadas}"><span style="width:${Math.min(100, ocupadas / z.aforo * 100)}%"></span></div>
        <div class="mt-3">
          <button class="btn ${bloqueada ? '' : 'amber'} btn-sm" type="button" data-accion="${bloqueada ? 'habilitar' : 'bloquear'}" data-f="${x.fecha}" data-h="${x.hora}" data-z="${x.zona}">${bloqueada ? 'Habilitar' : 'Bloquear'}</button>
        </div>
      </article>`;
    }).join('') : `<p class="empty">No hay franjas con reservas ni bloqueos${filtro.value ? ' en esa fecha' : ''}.</p>`;
  }
  function renderTodo(){
    $('notaAforo').textContent = (filtro.value ? 'Fecha: ' + fmtFecha(filtro.value) : 'Todas las fechas') + '. Aforo por zona: ' + ZONAS.map(z => `${z.n} ${z.aforo}`).join(', ') + ' personas.';
    renderReservas();
    renderFranjas();
  }

  /* Bloquea una franja; si ya tiene reservas, advierte antes de aplicar el cambio */
  async function pedirBloqueo(zona, fecha, hora){
    const n = activas(zona, fecha, hora).length;
    if(n > 0){
      const acepta = await confirmar('Esta franja ya tiene reservas',
        `Hay ${n} ${n > 1 ? 'reservas' : 'reserva'} en esta franja. Se mantienen; solo se bloquean las nuevas solicitudes de los Clientes.`,
        'Bloquear de todos modos');
      if(!acepta) return false;
    }
    if(!bloquearFranja(zona, fecha, hora)){ toast('No se pudo guardar el bloqueo'); return false; }
    toast('Franja bloqueada: los Clientes ya no la verán disponible');
    return true;
  }

  /* Acciones sobre las reservas */
  $('listaReservas').addEventListener('click', async e => {
    const b = e.target.closest('button[data-accion]');
    if(!b) return;
    const id = Number(b.dataset.id);
    if(b.dataset.accion === 'atender'){
      cambiarEstadoReserva(id, 'Atendida');
      toast('Reserva marcada como atendida');
    } else if(b.dataset.accion === 'cancelar'){
      if(!(await confirmar('Cancelar reserva', 'Se cancelará la reserva y se liberará el cupo de esa franja.', 'Sí, cancelar'))) return;
      cambiarEstadoReserva(id, 'Cancelada');
      toast('Reserva cancelada');
    }
    renderTodo();
  });

  /* Acciones sobre las franjas */
  $('listaFranjas').addEventListener('click', async e => {
    const b = e.target.closest('button[data-accion]');
    if(!b) return;
    const {f, h, z} = b.dataset;
    if(b.dataset.accion === 'habilitar'){
      habilitarFranja(z, f, h);
      toast('Franja habilitada: los Clientes ya pueden reservarla');
    } else if(!(await pedirBloqueo(z, f, h))) return;
    renderTodo();
  });

  /* Filtro por fecha */
  filtro.addEventListener('change', renderTodo);
  $('btnTodas').addEventListener('click', () => { filtro.value = ''; renderTodo(); });

  /* Bloquear una franja que todavía no tiene reservas */
  $('bHora').innerHTML = '<option value="">Selecciona hora</option>' + HORAS.map(h => `<option>${h}</option>`).join('');
  $('bZona').innerHTML = ZONAS.map(z => `<option value="${z.id}">${z.n}</option>`).join('');
  $('bFecha').min = hoyISO;
  $('formBloqueo').addEventListener('submit', async e => {
    e.preventDefault();
    const fecha = $('bFecha').value, hora = $('bHora').value, zona = $('bZona').value;
    $('e-bFecha').textContent = fecha ? '' : 'Selecciona una fecha.';
    $('e-bHora').textContent = hora ? '' : 'Selecciona una hora.';
    if(!fecha || !hora) return;
    if(estaBloqueada(zona, fecha, hora)){ $('e-bHora').textContent = 'Esa franja ya está bloqueada.'; return; }
    if(await pedirBloqueo(zona, fecha, hora)){ $('formBloqueo').reset(); renderTodo(); }
  });

  renderTodo();
}


/* ---------- 5. Arranque ---------- */
const PAGINAS = {
  inicio: initInicio,
  menu: initMenu,
  reservas: initReservas,
  login: initLogin,
  establecimiento: initEstablecimiento,
  'carta-admin': initCartaAdmin,
  agenda: initAgenda
};

const pagina = document.body.dataset.page;
if(PAGINAS_ADMIN.includes(pagina) && sessionStorage.getItem('admin') !== '1'){
  location.replace('login.html');
} else {
  renderNav();
  initNav();
  const arrancar = PAGINAS[pagina];
  if(arrancar) arrancar();
}
