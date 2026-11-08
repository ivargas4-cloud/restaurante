# Buen Sabor — Sitio web de restaurante

Sitio web de un restaurante con dos tipos de usuario: **Cliente** (consulta información, ve la carta y reserva mesa) y **Administrador** (gestiona la información del establecimiento, la carta y la agenda con el aforo).
Proyecto académico de Diseño Web y Usabilidad, Universidad de Investigación y Desarrollo (UDI).

## Integrantes
- Diany Valentina Ramirez Vera
- Jesus Manuel Ruiz Duran
- Isabella Vargas Camacho

## Tecnologías
Solo frontend, sin servidor ni base de datos:
- HTML5
- CSS3, en un único archivo (`css/styles.css`)
- JavaScript, en un único archivo (`js/app.js`)
- Los datos se guardan en el navegador con `localStorage`.

## Cómo ejecutarlo
1. Clona o descarga el repositorio.
2. Abre la carpeta en VS Code.
3. Haz clic derecho en `inicio.html` > **Open with Live Server**.

## Páginas
| Página | Descripción |
|---|---|
| `inicio.html` | Galería, información, horarios (con aviso de abierto/cerrado), contacto y mapa |
| `menu.html` | Carta de platos colombianos por categoría, con ventana de detalle |
| `index.html` | Reserva de mesa en 3 pasos |
| `login.html` | Inicio de sesión del administrador |
| `establecimiento.html` | Administrador: editar la información del establecimiento y la galería |
| `carta-admin.html` | Administrador: editar precio, descripción, foto y disponibilidad de los platos, y agregar platos |
| `agenda.html` | Administrador: ver reservas, filtrar por fecha, controlar el aforo y bloquear franjas |

## Acceso de administrador
El acceso es **simulado**: al ser solo frontend, no hay validación real. Escribe cualquier usuario y contraseña (por ejemplo `admin` / `1234`) y se entra.

## Si algo no se ve bien
Los datos se guardan en el navegador. Si ves información antigua, abre la consola (F12) y escribe `localStorage.clear()`, luego recarga con Ctrl+F5.
