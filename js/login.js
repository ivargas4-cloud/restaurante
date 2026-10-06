const form = document.getElementById('formLogin');
const back = document.getElementById('back');

back.addEventListener('click', () => { window.location.href = 'index.html'; });

form.addEventListener('submit', (e) => {
  e.preventDefault();
  let esValido = true;

  const usuario = document.getElementById('usuario');
  const clave = document.getElementById('clave');

  if (usuario.value.trim() === '') {
    document.getElementById('e-usuario').textContent = 'Este campo es obligatorio.';
    esValido = false;
  } else {
    document.getElementById('e-usuario').textContent = '';
  }

  if (clave.value.trim() === '') {
    document.getElementById('e-clave').textContent = 'Este campo es obligatorio.';
    esValido = false;
  } else {
    document.getElementById('e-clave').textContent = '';
  }

  if (!esValido) return;

  // Al ser solo frontend, cualquier usuario/contraseña entra (no hay validación real contra una base de datos)
  window.location.href = 'establecimiento.html';
});