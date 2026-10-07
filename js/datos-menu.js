const CATS=[
 {n:'Entradas',i:'🍴',c:'var(--c1)',items:[
  {n:'Bruschetta clásica',d:'Pan artesanal con tomate y albahaca.',p:8500,e:'🥖',h:28,img:'',disp:true},
  {n:'Ensalada César',d:'Lechuga fresca, pollo, crotones y aderezo.',p:10000,e:'🥗',h:100,img:'',disp:true},
  {n:'Empanadas criollas',d:'Rellenas de carne y papa, con ají casero.',p:7000,e:'🥟',h:38,img:'',disp:true},
  {n:'Nachos con guacamole',d:'Totopos crujientes, guacamole y queso gratinado.',p:11000,e:'🥑',h:110,img:'',disp:true},
  {n:'Croquetas de jamón',d:'Seis croquetas doradas con salsa tártara.',p:9500,e:'🧆',h:32,img:'',disp:true},
  {n:'Sopa de tomate',d:'Cremosa, con albahaca fresca y pan tostado.',p:8000,e:'🍅',h:8,img:'',disp:true},
  {n:'Alitas BBQ',d:'Alitas de pollo bañadas en salsa barbacoa.',p:12500,e:'🍗',h:22,img:'',disp:true},
  {n:'Patacones con hogao',d:'Plátano verde frito con hogao y queso rallado.',p:8000,e:'🍌',h:50,img:'',disp:true}]},
 {n:'Platos fuertes',i:'🍽️',c:'var(--c2)',items:[
  {n:'Bandeja paisa',d:'Frijoles, arroz, chicharrón, carne, huevo y plátano.',p:28000,e:'🍛',h:30,img:'',disp:true},
  {n:'Salmón a la plancha',d:'Con puré de papa y vegetales salteados.',p:34000,e:'🐟',h:15,img:'',disp:true},
  {n:'Pasta Alfredo con pollo',d:'Pasta cremosa con pollo y parmesano.',p:24000,e:'🍝',h:45,img:'',disp:true},
  {n:'Lomo de res al vino',d:'Lomo tierno en salsa de vino tinto y papas rústicas.',p:36000,e:'🥩',h:355,img:'',disp:true},
  {n:'Pollo a la parrilla',d:'Media pechuga marinada, arroz y ensalada fresca.',p:26000,e:'🍖',h:25,img:'',disp:true},
  {n:'Arroz con mariscos',d:'Camarones, calamar y almejas en arroz sofrito.',p:32000,e:'🦐',h:12,img:'',disp:true},
  {n:'Churrasco con papas',d:'Corte de res a la brasa con papas a la francesa.',p:33000,e:'🥓',h:5,img:'',disp:true},
  {n:'Lasaña de carne',d:'Capas de pasta, carne, bechamel y queso gratinado.',p:25000,e:'🧀',h:42,img:'',disp:true}]},
 {n:'Bebidas',i:'🥤',c:'var(--c3)',items:[
  {n:'Limonada de coco',d:'Refrescante, con leche de coco y hielo.',p:9000,e:'🥥',h:190,img:'',disp:true},
  {n:'Jugo de lulo',d:'Natural, preparado en agua o en leche.',p:7000,e:'🍹',h:75,img:'',disp:true},
  {n:'Café de origen',d:'Grano santandereano, servido caliente.',p:5000,e:'☕',h:25,img:'',disp:true},
  {n:'Limonada cerezada',d:'Limón, cerezas y un toque de menta.',p:8000,e:'🍒',h:350,img:'',disp:true},
  {n:'Jugo de mora',d:'Mora de Castilla natural, en agua o leche.',p:6500,e:'🫐',h:280,img:'',disp:true},
  {n:'Té frío de durazno',d:'Té negro infusionado con durazno y hielo.',p:6000,e:'🍑',h:20,img:'',disp:true},
  {n:'Malteada de vainilla',d:'Helado de vainilla, leche y crema chantilly.',p:11000,e:'🥛',h:210,img:'',disp:true},
  {n:'Agua con gas',d:'Botella de 330 ml, bien fría.',p:4000,e:'💧',h:200,img:'',disp:true}]},
 {n:'Postres',i:'🍰',c:'var(--c4)',items:[
  {n:'Tiramisú',d:'Postre tradicional con café y mascarpone.',p:6500,e:'🍰',h:20,img:'',disp:true},
  {n:'Brownie con helado',d:'Brownie tibio de chocolate con helado de vainilla.',p:8000,e:'🍫',h:18,img:'',disp:true},
  {n:'Flan de caramelo',d:'Suave y cremoso, bañado en caramelo casero.',p:6000,e:'🍮',h:35,img:'',disp:true},
  {n:'Cheesecake de maracuyá',d:'Base de galleta y cobertura de maracuyá.',p:9000,e:'🥭',h:48,img:'',disp:true},
  {n:'Tres leches',d:'Bizcocho húmedo con crema y canela.',p:7500,e:'🧁',h:340,img:'',disp:true},
  {n:'Helado artesanal',d:'Tres bolas a elección: vainilla, mora o chocolate.',p:7000,e:'🍦',h:330,img:'',disp:true},
  {n:'Arroz con leche',d:'Receta casera con canela y pasas.',p:5500,e:'🥣',h:40,img:'',disp:true},
  {n:'Tarta de limón',d:'Masa crocante con crema de limón y merengue.',p:8000,e:'🍋',h:55,img:'',disp:true}]}
];

// --- Trae ediciones guardadas por el Administrador (si existen) y las aplica ---
(function aplicarCambiosGuardados(){
    const guardado = localStorage.getItem('menuOverrides');
    if (!guardado) return;
        const cambios = JSON.parse(guardado); // { "Entradas|Bruschetta clásica": {p: 9000, disp: false}, ... }
        CATS.forEach(cat => {
            cat.items.forEach(item => {
                const clave = cat.n + '|' + item.n;
                if (cambios[clave]) {
                    if (cambios[clave].p !== undefined) item.p = cambios[clave].p;
                    if (cambios[clave].disp !== undefined) item.disp = cambios[clave].disp;
                    if (cambios[clave].img !== undefined) item.img = cambios[clave].img;
                }
            });
        });
    
    const nuevosGuardados = localStorage.getItem('menuNuevos');
        if (nuevosGuardados) {
        const nuevos = JSON.parse(nuevosGuardados);
        nuevos.forEach(({ cat, plato }) => {
            const categoria = CATS.find(c => c.n === cat);
            if (categoria) categoria.items.push(plato);
        });
    }
})();

