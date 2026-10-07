const catsFilter = document.getElementById('catsFilter');
const listaPlatos = document.getElementById('listaPlatos');
const btnGuardarMenu = document.getElementById('btnGuardarMenu');
const alertaMenuOk = document.getElementById('alertaMenuOk');
const alertaMenuErr = document.getElementById('alertaMenuErr');

let categoriaActiva = 'todas';

// --- Dropdown "Administración" ---
const btnAdminNav = document.getElementById('btnAdminNav');
const adminMenu = document.getElementById('adminMenu');
btnAdminNav.addEventListener('click', (e) => {
  e.stopPropagation();
  const abierto = !adminMenu.hidden;
  adminMenu.hidden = abierto;
  btnAdminNav.setAttribute('aria-expanded', String(!abierto));
});
document.addEventListener('click', () => {
  adminMenu.hidden = true;
  btnAdminNav.setAttribute('aria-expanded', 'false');
});
adminMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    adminMenu.hidden = true;
    btnAdminNav.setAttribute('aria-expanded', 'false');
  });
});

// --- Dropdown "Administrador" (cerrar sesión) ---
const btnUserMenu = document.getElementById('btnUserMenu');
const userMenu = document.getElementById('userMenu');
btnUserMenu.addEventListener('click', (e) => {
  e.stopPropagation();
  const abierto = !userMenu.hidden;
  userMenu.hidden = abierto;
  btnUserMenu.setAttribute('aria-expanded', String(!abierto));
});
document.addEventListener('click', () => {
  userMenu.hidden = true;
  btnUserMenu.setAttribute('aria-expanded', 'false');
});
document.getElementById('btnLogout').addEventListener('click', (e) => {
  e.preventDefault();
  window.location.href = 'menu.html';
});

// --- Filtro de categorías (Branch Sequence 3.1 de tu ficha) ---
function renderFiltro(){
  const botones = ['todas', ...CATS.map(c => c.n)];
  catsFilter.innerHTML = botones.map(nombre =>
    `<button type="button" data-cat="${nombre}" aria-pressed="${nombre===categoriaActiva}">${nombre === 'todas' ? 'Todas' : nombre}</button>`
  ).join('');
}
catsFilter.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-cat]');
  if (!btn) return;
  categoriaActiva = btn.dataset.cat;
  renderFiltro();
  renderLista();
});

// --- Lista de platos con precio y disponibilidad editables ---
function renderLista(){
  const categorias = categoriaActiva === 'todas' ? CATS : CATS.filter(c => c.n === categoriaActiva);
  listaPlatos.innerHTML = categorias.map(cat => `
    <div class="cat-group">
      <h3>${cat.n}</h3>
      ${cat.items.map((item, idx) => `
        <div class="plato-row">
          <div class="nombre">
            ${item.img ? `<img src="${item.img}" alt="" class="plato-thumb">` : ''}
            <span>${item.e} ${item.n}</span>
            <input type="file" accept="image/*" class="plato-foto-input" data-cat="${cat.n}" data-idx="${idx}" aria-label="Cambiar foto de ${item.n}">
          </div>
          <input class="ctl" type="number" min="0" step="500" value="${item.p}" data-cat="${cat.n}" data-idx="${idx}" data-field="precio" aria-label="Precio de ${item.n}">
          <label class="chk">
            <input type="checkbox" ${item.disp ? 'checked' : ''} data-cat="${cat.n}" data-idx="${idx}" data-field="disp" aria-label="Disponible: ${item.n}">
            Disponible
          </label>
        </div>
      `).join('')}
    </div>
  `).join('');
}

// --- Guardar cambios (valida, actualiza y persiste) ---
btnGuardarMenu.addEventListener('click', () => {
  alertaMenuOk.hidden = true;
  alertaMenuErr.hidden = true;

  const inputsPrecio = listaPlatos.querySelectorAll('input[data-field="precio"]');
  let hayError = false;
  inputsPrecio.forEach(input => {
    const valor = Number(input.value);
    if (isNaN(valor) || valor < 0) {
      input.setAttribute('aria-invalid', 'true');
      hayError = true;
    } else {
      input.removeAttribute('aria-invalid');
    }
  });

  if (hayError) {
    alertaMenuErr.textContent = 'Hay precios inválidos. Revisa los campos marcados en rojo.';
    alertaMenuErr.hidden = false;
    return;
  }

  const overrides = JSON.parse(localStorage.getItem('menuOverrides') || '{}');
  listaPlatos.querySelectorAll('.plato-row').forEach(fila => {
    const inputPrecio = fila.querySelector('input[data-field="precio"]');
    const inputDisp = fila.querySelector('input[data-field="disp"]');
    const catNombre = inputPrecio.dataset.cat;
    const idx = Number(inputPrecio.dataset.idx);
    const categoria = CATS.find(c => c.n === catNombre);
    const item = categoria.items[idx];

    item.p = Number(inputPrecio.value);
    item.disp = inputDisp.checked;

    const clave = catNombre + '|' + idx; // idx vendrá del data-idx
    if (fotosPendientes[clave]) {
    item.img = fotosPendientes[clave];
    }

    overrides[catNombre + '|' + item.n] = { p: item.p, disp: item.disp, img: item.img };
  });

  localStorage.setItem('menuOverrides', JSON.stringify(overrides));
  alertaMenuOk.hidden = false;
});

const fotosPendientes = {};

listaPlatos.addEventListener('change', async (e) => {
  const input = e.target.closest('.plato-foto-input');
  if (!input) return;
  const archivo = input.files[0];
  if (!archivo) return;

  const base64 = await leerImagenComoBase64(archivo);
  const clave = input.dataset.cat + '|' + input.dataset.idx;
  fotosPendientes[clave] = base64;

  // Vista previa inmediata
  const fila = input.closest('.plato-row');
  let thumb = fila.querySelector('.plato-thumb');
  if (!thumb) {
    thumb = document.createElement('img');
    thumb.className = 'plato-thumb';
    fila.querySelector('.nombre').prepend(thumb);
  }
  thumb.src = base64;
});

renderFiltro();
renderLista();

// --- Agregar nuevo plato ---
const formNuevoPlato = document.getElementById('formNuevoPlato');
const npCategoria = document.getElementById('npCategoria');

npCategoria.innerHTML = CATS.map(c => `<option value="${c.n}">${c.n}</option>`).join('');

formNuevoPlato.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nombre = document.getElementById('npNombre');
  const descripcion = document.getElementById('npDescripcion');
  const precio = document.getElementById('npPrecio');
  let esValido = true;

  [['npNombre', nombre], ['npDescripcion', descripcion]].forEach(([id, campo]) => {
    const errorP = document.getElementById('e-' + id);
    if (campo.value.trim() === '') {
      errorP.textContent = 'Este campo es obligatorio.';
      esValido = false;
    } else {
      errorP.textContent = '';
    }
  });

  const valorPrecio = Number(precio.value);
  const errorPrecio = document.getElementById('e-npPrecio');
  if (precio.value.trim() === '' || isNaN(valorPrecio) || valorPrecio <= 0) {
    errorPrecio.textContent = 'Ingresa un precio válido mayor a 0.';
    esValido = false;
  } else {
    errorPrecio.textContent = '';
  }

  if (!esValido) return;

  const archivoFoto = document.getElementById('npFoto').files[0];
    let imgBase64 = '';
    if (archivoFoto) {
        imgBase64 = await leerImagenComoBase64(archivoFoto);
    }

  const nuevoPlato = {
    n: nombre.value.trim(),
    d: descripcion.value.trim(),
    p: valorPrecio,
    e: '🍽️',
    h: 30,
    img: imgBase64,
    disp: true
  };

  const categoria = CATS.find(c => c.n === npCategoria.value);
  categoria.items.push(nuevoPlato);

  // Guardamos el plato nuevo para que persista y se vea en la carta del Cliente
  const nuevos = JSON.parse(localStorage.getItem('menuNuevos') || '[]');
  nuevos.push({ cat: npCategoria.value, plato: nuevoPlato });
  localStorage.setItem('menuNuevos', JSON.stringify(nuevos));

  formNuevoPlato.reset();
  renderFiltro();
  renderLista();
});

function leerImagenComoBase64(archivo){
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result);
    lector.onerror = reject;
    lector.readAsDataURL(archivo);
  });
}