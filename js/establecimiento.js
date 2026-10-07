const btnAdminNav = document.getElementById('btnAdminNav');
const adminMenu = document.getElementById('adminMenu');

btnAdminNav.addEventListener('click', (e) => {
  e.stopPropagation();
  const abierto = !adminMenu.hidden;
  adminMenu.hidden = abierto;
  btnAdminNav.setAttribute('aria-expanded', String(!abierto));
});

// Cerrar si el Administrador hace clic afuera del menú
document.addEventListener('click', () => {
  adminMenu.hidden = true;
  btnAdminNav.setAttribute('aria-expanded', 'false');
});

// Cerrar el menú y evitar el salto de página al hacer clic en una opción
adminMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    adminMenu.hidden = true;
    btnAdminNav.setAttribute('aria-expanded', 'false');
  });
});

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

// --- 1. Seleccionamos todos los elementos que vamos a necesitar ---
const form = document.getElementById('formInfo');
const btnEditar = document.getElementById('btnEditar');
const btnCancelar = document.getElementById('btnCancelar');
const btnGuardar = document.getElementById('btnGuardar');
const alertaOk = document.getElementById('alertaOk');

// Todos los campos del formulario (inputs, textarea, checkboxes, archivo)
const campos = form.querySelectorAll('input, textarea');
const serviciosFieldset = document.getElementById('servicios');

// Guardamos los valores originales, por si el Administrador cancela
let valoresOriginales = {};

// --- 2. Al hacer clic en "Editar información" ---
btnEditar.addEventListener('click', () => {
  // Guardamos los valores actuales antes de permitir editar
  valoresOriginales = {
    nombreEst: document.getElementById('nombreEst').value,
    direccion: document.getElementById('direccion').value,
    telefono: document.getElementById('telefono').value,
    horarios: document.getElementById('horarios').value,
    descripcion: document.getElementById('descripcion').value,
  };

  // Habilitamos todos los campos
  campos.forEach(campo => campo.disabled = false);
  serviciosFieldset.disabled = false;

  // Habilitamos los botones de acción y deshabilitamos "Editar"
  btnCancelar.disabled = false;
  btnGuardar.disabled = false;
  btnEditar.disabled = true;

  // Ocultamos cualquier mensaje de confirmación anterior
  alertaOk.hidden = true;
});
  // --- 3. Al hacer clic en "Cancelar" ---
btnCancelar.addEventListener('click', () => {
  // Devolvemos los campos a sus valores originales
  document.getElementById('nombreEst').value = valoresOriginales.nombreEst;
  document.getElementById('direccion').value = valoresOriginales.direccion;
  document.getElementById('telefono').value = valoresOriginales.telefono;
  document.getElementById('horarios').value = valoresOriginales.horarios;
  document.getElementById('descripcion').value = valoresOriginales.descripcion;

  // Limpiamos mensajes de error que hubiera
  form.querySelectorAll('.err').forEach(p => p.textContent = '');

  // Volvemos a bloquear todo
  campos.forEach(campo => campo.disabled = true);
  serviciosFieldset.disabled = true;
  btnCancelar.disabled = true;
  btnGuardar.disabled = true;
  btnEditar.disabled = false;
});

// --- 4. Al hacer clic en "Guardar cambios" ---
form.addEventListener('submit', (evento) => {
  evento.preventDefault(); // evita que la página se recargue

  let esValido = true;

  // Validamos que los campos obligatorios no estén vacíos
  const requeridos = ['nombreEst', 'direccion', 'telefono', 'horarios', 'descripcion'];
  requeridos.forEach(id => {
    const campo = document.getElementById(id);
    const errorP = document.getElementById('e-' + id);
    if (campo.value.trim() === '') {
      errorP.textContent = 'Este campo es obligatorio.';
      esValido = false;
    } else {
      errorP.textContent = '';
    }
  });

  // Validamos el formato de la imagen (si cargó alguna)
  const galeria = document.getElementById('galeria');
  const errorGaleria = document.getElementById('e-galeria');
  const formatosValidos = ['image/jpeg', 'image/png', 'image/webp'];
  if (galeria.files.length > 0) {
    const archivosInvalidos = Array.from(galeria.files).some(
      archivo => !formatosValidos.includes(archivo.type)
    );
    if (archivosInvalidos) {
      errorGaleria.textContent = 'Formato no válido. Usa JPG, PNG o WEBP.';
      esValido = false;
    } else {
      errorGaleria.textContent = '';
    }
  }

  // Si algo falló, no continuamos
  if (!esValido) return;

  // Si todo está bien: bloqueamos los campos de nuevo y mostramos confirmación
  campos.forEach(campo => campo.disabled = true);
  serviciosFieldset.disabled = true;
  btnCancelar.disabled = true;
  btnGuardar.disabled = true;
  btnEditar.disabled = false;

  alertaOk.hidden = false;
});