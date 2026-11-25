// Orden en que aparecen los cargos 
const ORDEN_CARGOS = ["Dueño / Gerencia", "Ventas", "Marketing", "Soporte Técnico"];

document.addEventListener('DOMContentLoaded', cargarEquipo);

// Convierte texto en HTML seguro
function esc(texto) {
    const d = document.createElement('div');
    d.textContent = texto ?? '';
    return d.innerHTML;
}

function posicionCargo(cargo) {
    const i = ORDEN_CARGOS.indexOf(cargo);
    return i === -1 ? 99 : i;   // cargos desconocidos al final
}

async function cargarEquipo() {
    const seccion = document.getElementById('equipo');
    const track = document.getElementById('equipoTrack');
    if (!track) return;

    try {
        const res = await fetch(`${linkApi}/miembroequipos`);
        if (!res.ok) throw new Error(`Error ${res.status}`);

        const lista = (await res.json())
            .filter(m => m.activo)   // los inactivos no se muestran al público
            .sort((a, b) => posicionCargo(a.cargo) - posicionCargo(b.cargo)
                || a.nombreCompleto.localeCompare(b.nombreCompleto));

        if (lista.length === 0) {
            seccion.style.display = 'none';
            return;
        }

        track.innerHTML = lista.map(crearCard).join('');
        activarFlechas();
    } catch (error) {
        console.error('Error al cargar el equipo', error);
        seccion.style.display = 'none';   // si falla la API, no mostramos una sección rota
    }
}

function crearCard(m) {
    // Las etiquetas vienen como texto JSON: las convertimos a array
    let etiquetas = [];
    try {
        etiquetas = JSON.parse(m.etiquetasJson || '[]');
    } catch (e) { /* JSON mal formado: queda sin etiquetas */ }

    const etiquetasHtml = etiquetas.length > 0
        ? `<div class="equipo-tags">${etiquetas.map(e => `<span class="equipo-tag">${esc(e)}</span>`).join('')}</div>`
        : '';

    // Sin foto: fondo oscuro con la inicial
    const foto = m.imagenUrl
        ? `<img src="${esc(m.imagenUrl)}" alt="${esc(m.nombreCompleto)}" class="equipo-foto" loading="lazy">`
        : `<div class="equipo-foto equipo-sin-foto">${esc(m.nombreCompleto.charAt(0))}</div>`;

    const desc = m.descripcion
        ? `<div class="equipo-desc-wrap"><p class="equipo-desc">${esc(m.descripcion)}</p></div>`
        : '';

    // La flecha solo aparece si hay descripción para descubrir
    const flecha = m.descripcion
        ? `<span class="equipo-flecha" aria-hidden="true"><i class="bi bi-arrow-up"></i></span>`
        : '';

    return `
    <article class="equipo-card" tabindex="0">
        ${foto}
        <div class="equipo-info">
            <div class="equipo-top">
                <h3 class="equipo-nombre">${esc(m.nombreCompleto)}</h3>
                ${flecha}
            </div>
            ${etiquetasHtml}
            ${desc}
        </div>
    </article>`;
}

// Flechas: desplazan el carrusel una card y se desactivan en los extremos
function activarFlechas() {
    const track = document.getElementById('equipoTrack');
    const prev = document.getElementById('equipoPrev');
    const next = document.getElementById('equipoNext');

    const paso = () => {
        const card = track.querySelector('.equipo-card');
        return card ? card.offsetWidth + 20 : 300;   // ancho de la card + el gap
    };

    const actualizar = () => {
        prev.disabled = track.scrollLeft <= 4;
        next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    };

    prev.onclick = () => track.scrollBy({ left: -paso(), behavior: 'smooth' });
    next.onclick = () => track.scrollBy({ left: paso(), behavior: 'smooth' });
    track.addEventListener('scroll', actualizar, { passive: true });
    window.addEventListener('resize', actualizar);
    actualizar();
}