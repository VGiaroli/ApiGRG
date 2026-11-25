document.addEventListener('DOMContentLoaded', cargarCategoriasInicio);

// Convierte texto en HTML seguro
function escCategoria(texto) {
    const d = document.createElement('div');
    d.textContent = texto ?? '';
    return d.innerHTML;
}

async function cargarCategoriasInicio() {
    const seccion = document.getElementById('categorias');
    const grid = document.getElementById('categoriasGrid');
    if (!grid) return;

    try {
        const res = await fetch(`${linkApi}/categorias/destacadas`);
        if (!res.ok) throw new Error(`Error ${res.status}`);

        const lista = await res.json();

        // Si no hay ninguna marcada, ocultamos la sección
        if (lista.length === 0) {
            seccion.style.display = 'none';
            return;
        }

        grid.innerHTML = lista.map(crearCardCategoria).join('');
        if (window.AOS) AOS.refreshHard();   // para que las animaciones tomen las cards nuevas
    } catch (error) {
        console.error('Error al cargar las categorías', error);
        seccion.style.display = 'none';
    }
}

function crearCardCategoria(c, i) {
    const numero = String(i + 1).padStart(2, '0');   // 01, 02, 03, 04
    const claseLima = i === 1 ? ' ec-lime' : '';      // la segunda card tiene el estilo lima, como antes

    // Si no tiene imagen, la card se ve con el degradado oscuro
    const fondo = c.imagenUrl
        ? `style="background-image: url('${encodeURI(c.imagenUrl).replace(/'/g, '%27')}');"`
        : '';

    return `
    <div class="col-6 col-lg-3" data-aos="zoom-in" data-aos-delay="${i * 100}">
        <a href="#destacados" class="editorial-card${claseLima}" ${fondo}>
            <span class="ed-mark ed-arrow">
                <iconify-icon icon="lucide:arrow-up-right"></iconify-icon>
            </span>
            <span class="ed-num">${numero}.</span>
            <div>
                <p class="ed-title mb-0">${escCategoria(c.nombreProducto)}</p>
                <p class="ed-desc mb-0">${escCategoria(c.descripcion)}</p>
            </div>
        </a>
    </div>`;
}