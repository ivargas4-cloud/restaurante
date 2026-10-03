const $=id=>document.getElementById(id);
const MESAS=[{n:1,c:2},{n:2,c:2},{n:3,c:4},{n:4,c:6},{n:5,c:8},{n:6,c:10}];
const campos=['nombre','celular','personas','fecha','hora','correo'];

/* ---------- Opciones de selects y fecha mínima ---------- */
$('personas').innerHTML='<option value="">Selecciona</option>'+Array.from({length:10},(_,i)=>`<option value="${i+1}">${i+1} ${i?'personas':'persona'}</option>`).join('');
let h='<option value="">Selecciona hora</option>';
for(let m=12*60;m<=21*60;m+=30){const hh=Math.floor(m/60),mm=m%60;h+=`<option>${String(hh).padStart(2,'0')}:${mm?'30':'00'}</option>`}
$('hora').innerHTML=h;
const hoy=new Date();const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const min=iso(hoy);const maxD=new Date(hoy);maxD.setDate(maxD.getDate()+90);
$('fecha').min=min;$('fecha').max=iso(maxD);

/* ---------- Validaciones ---------- */
const reglas={
  nombre:v=>!v.trim()?'Escribe tu nombre completo.':!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' ]{3,60}$/.test(v.trim())?'Usa solo letras (mínimo 3).':(v.trim().split(/\s+/).length<2?'Incluye nombre y apellido.':''),
  celular:v=>!v?'Escribe tu número de celular.':!/^3\d{9}$/.test(v)?'Debe tener 10 dígitos y empezar por 3.':'',
  personas:v=>!v?'Selecciona la cantidad de personas.':'',
  fecha:v=>!v?'Selecciona una fecha.':v<min?'La fecha no puede ser anterior a hoy.':v>iso(maxD)?'Solo se reserva con 90 días de anticipación.':'',
  hora:v=>{if(!v)return 'Selecciona una hora.';
    if($('fecha').value===min){const [a,b]=v.split(':').map(Number);if(a*60+b<=hoy.getHours()*60+hoy.getMinutes())return 'Esa hora ya pasó. Elige una posterior.'}return ''},
  correo:v=>v&&!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())?'Escribe un correo válido, por ejemplo nombre@dominio.com.':''
};
function validar(c){
  const el=$(c),e=reglas[c](el.value),p=$('e-'+c);
  p.textContent=e;el.setAttribute('aria-invalid',e?'true':'false');
  if(e)el.setAttribute('aria-describedby','e-'+c);else el.removeAttribute('aria-describedby');
  return !e;
}
const validarTodo=()=>campos.map(validar).every(Boolean);

/* ---------- Disponibilidad simulada (cambia según el día y la hora) ---------- */
const hash=s=>{let x=0;for(const ch of s)x=(x*31+ch.charCodeAt(0))>>>0;return x};
function ocupada(m,f,hr){
  if(+f.slice(-2)===15)return true;               // día 15: todo reservado
  return hash(f+hr+m.n)%100<35;
}
function pintarMesas(){
  const f=$('fecha').value,hr=$('hora').value,p=+$('personas').value;
  const listo=f&&hr&&p&&!reglas.fecha(f)&&!reglas.hora(hr);
  const prev=document.querySelector('input[name=mesa]:checked'),pv=prev&&prev.value;
  let libres=0;
  $('tables').innerHTML=MESAS.map(m=>{
    const dis=!listo||ocupada(m,f,hr)||m.c<p;
    if(!dis)libres++;
    return `<label class="t"><input type="radio" name="mesa" value="${m.n}" ${dis?'disabled':''} ${!dis&&pv==m.n?'checked':''}><span>Mesa ${m.n}<small>(${m.c} P)</small></span></label>`}).join('');
  $('hint').textContent=!listo?'Elige fecha, hora y cantidad de personas para ver las mesas.':
    libres?`${libres} ${libres>1?'mesas libres':'mesa libre'} para ${p} ${p>1?'personas':'persona'} el ${f.split('-').reverse().join('/')} a las ${hr}.`:
    'No hay mesas disponibles para esa selección. Prueba con otra hora o fecha.';
}

/* ---------- Eventos ---------- */
$('celular').addEventListener('input',e=>{e.target.value=e.target.value.replace(/\D/g,'')});
campos.forEach(c=>{
  $(c).addEventListener('blur',()=>validar(c));
  $(c).addEventListener('input',()=>{if($(c).getAttribute('aria-invalid')==='true')validar(c)});
});
['fecha','hora','personas'].forEach(c=>$(c).addEventListener('change',()=>{if(c==='fecha'&&$('hora').value)validar('hora');pintarMesas()}));
const mostrar=(id,t)=>{const a=$(id);a.textContent=t;a.classList.add('show')};
const ocultar=id=>$(id).classList.remove('show');
const mesaSel=()=>document.querySelector('input[name=mesa]:checked');
const esc=t=>t.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fila=(a,b)=>`<dt>${a}</dt><dd>${b}</dd>`;
const MSG3='Una vez seleccionada la mesa, confirma la reserva.';
const datosOk=()=>campos.every(c=>!reglas[c]($(c).value));
function bloquear(id,v){const p=$(id);p.classList.toggle('locked',v);p.inert=v}
function bloquear3(){bloquear('p3',true);$('confirmar').disabled=true;$('msg').textContent=MSG3;ocultar('alerta3')}

/* Paso 1 → 2: las mesas se habilitan cuando los datos son válidos */
function actualizar(){
  const ok=datosOk();
  bloquear('p2',!ok);
  pintarMesas();
  if(!ok)$('hint').textContent='Completa los datos de la reserva para habilitar las mesas.';
  if(!ok||!mesaSel())bloquear3();
}
$('form').addEventListener('input',actualizar);
$('form').addEventListener('change',actualizar);
$('tables').addEventListener('change',()=>{ocultar('alerta2');bloquear3()});

/* Paso 2 → 3: botón Continuar */
$('continuar2').onclick=()=>{
  ocultar('alerta2');
  if(!mesaSel()){
    mostrar('alerta2',document.querySelector('input[name=mesa]:not(:disabled)')?'Selecciona una mesa disponible para continuar.':'No hay mesas disponibles para esa selección. Cambia la fecha, la hora o la cantidad de personas.');return}
  bloquear('p3',false);$('confirmar').disabled=false;
  $('msg').textContent=`Mesa ${mesaSel().value} seleccionada. Revisa tus datos y confirma la reserva.`;
  $('p3').scrollIntoView({behavior:'smooth',block:'center'});
};

/* Paso 3: confirmar */
$('confirmar').onclick=()=>{
  ocultar('alerta3');
  if(!validarTodo()||!mesaSel()){
    mostrar('alerta3','No se pudo confirmar: hay datos inválidos o falta seleccionar una mesa.');return}
  const m=+mesaSel().value,mm=MESAS[m-1];
  $('resumen').innerHTML=fila('Nombre',esc($('nombre').value.trim()))+fila('Celular',$('celular').value)+
    fila('Fecha',$('fecha').value.split('-').reverse().join('/'))+fila('Hora',$('hora').value)+
    fila('Personas',$('personas').value)+fila('Mesa',`Mesa ${m} (${mm.c} P)`)+
    ($('correo').value?fila('Correo',esc($('correo').value.trim())):'');
  $('ok').showModal();
};
$('nueva').onclick=()=>{
  $('ok').close();$('form').reset();
  campos.forEach(c=>{$('e-'+c).textContent='';$(c).setAttribute('aria-invalid','false')});
  ['alerta2','alerta3'].forEach(ocultar);actualizar();window.scrollTo({top:0,behavior:'smooth'});
};

let tt;function toast(t){const el=$('toast');el.textContent=t;el.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>el.classList.remove('show'),1800)}
const PAGINA_INICIO='';
function irInicio(e){e&&e.preventDefault();PAGINA_INICIO?location.href=PAGINA_INICIO:toast('Volver: aquí te llevaría al Inicio del restaurante')}
$('back').onclick=irInicio;$('navInicio').onclick=irInicio;
document.querySelectorAll('[data-soon]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();toast(a.textContent+': página fuera del alcance del prototipo')}));

actualizar();