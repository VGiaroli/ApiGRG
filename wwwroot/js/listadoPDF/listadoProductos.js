function imprimir() {

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');

    const COLOR_PRIMARIO = [31, 78, 121];      // Azul corporativo (mismo tono del header de la tabla)
    const COLOR_TEXTO_SUAVE = [120, 120, 120];
    const COLOR_TEXTO_FUERTE = [45, 45, 45];
    const COLOR_BORDE = [222, 225, 229];

    // Colores para diferenciar de un vistazo las columnas de precio
    const COLOR_ARS_FONDO = [227, 238, 249];   // celeste suave
    const COLOR_ARS_TEXTO = [21, 82, 130];     // azul
    const COLOR_USD_FONDO = [227, 244, 233];   // verde suave
    const COLOR_USD_TEXTO = [30, 110, 70];     // verde oscuro

    // ============================
    // OCULTAR COLUMNA "ACCIÓN" SI EXISTE
    // ============================
    const tablaOriginal = document.querySelector('#tablaInformeProductos');
    const tablaClon = tablaOriginal.cloneNode(true);

    const cabeceras = tablaOriginal.querySelectorAll('thead th');
    let indiceAccion = -1;

    cabeceras.forEach((th, i) => {
        const texto = th.textContent.trim().toLowerCase();
        if (texto === 'action' || texto === 'acción') {
            indiceAccion = i;
        }
    });

    if (indiceAccion !== -1) {
        tablaClon.querySelectorAll('tr').forEach(row => {
            if (row.children[indiceAccion]) {
                row.children[indiceAccion].remove();
            }
        });
    }

    // ============================
    // FRANJA SUPERIOR DE MARCA
    // ============================
    pdf.setFillColor(...COLOR_PRIMARIO);
    pdf.rect(0, 0, 210, 6, 'F');

    //código para insertar imagen (si tenés logo como <img id="imgLogo">)
    // const imagen = document.getElementById('imgLogo');
    // pdf.addImage(imagen, 'PNG', 174, 12, 21, 14);

    // ============================
    // ENCABEZADO
    // ============================
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...COLOR_TEXTO_FUERTE);

    pdf.text(
        'Listado de Productos',
        105,
        20,
        { align: 'center' }
    );

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(...COLOR_TEXTO_SUAVE);

    pdf.text(
        'Catálogo de inventario',
        105,
        26.5,
        { align: 'center' }
    );

    // Línea separadora, en color de marca en vez de negro puro
    pdf.setDrawColor(...COLOR_PRIMARIO);
    pdf.setLineWidth(0.5);
    pdf.line(15, 32, 195, 32);

    // ============================
    // RECUADRO DE RESUMEN
    // ============================
    const filasProductos = document.querySelectorAll('#tablaInformeProductos tbody tr');
    const cantidadProductos = filasProductos.length;

    let totalUSD = 0;
    filasProductos.forEach(row => {
        const celdaUSD = row.children[3];
        if (celdaUSD) {
            const valor = parseFloat(celdaUSD.textContent.replace(/\./g, '').replace(',', '.')) || 0;
            totalUSD += valor;
        }
    });

    pdf.setFillColor(248, 249, 250);
    pdf.setDrawColor(...COLOR_BORDE);
    pdf.setLineWidth(0.3);

    pdf.roundedRect(15, 39, 180, 16, 2, 2, 'FD');

    // Línea divisoria vertical entre los dos datos del recuadro
    pdf.setDrawColor(...COLOR_BORDE);
    pdf.setLineWidth(0.25);
    pdf.line(105, 42.5, 105, 51.5);

    // Total de productos
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(...COLOR_TEXTO_SUAVE);
    pdf.text('TOTAL DE PRODUCTOS', 22, 45.5);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(...COLOR_TEXTO_FUERTE);
    pdf.text(String(cantidadProductos), 22, 51.5);

    // Valor total del inventario
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(...COLOR_TEXTO_SUAVE);
    pdf.text('VALOR TOTAL DEL INVENTARIO', 113, 45.5);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(...COLOR_USD_TEXTO);
    pdf.text('U$D ' + totalUSD.toLocaleString('es-AR'), 113, 51.5);

    // ============================
    // TABLA
    // ============================
    pdf.autoTable({

        html: tablaClon,

        startY: 62,

        theme: 'grid',

        styles: {
            font: 'helvetica',
            fontSize: 8.5,
            cellPadding: 3.2,
            lineWidth: 0.1,
            lineColor: COLOR_BORDE,
            valign: 'middle'
        },

        headStyles: {
            fillColor: COLOR_PRIMARIO,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 8.5,
            valign: 'middle'
        },

        didParseCell: function (data) {

            if (data.section === 'head') {
                data.cell.styles.halign = data.column.index === 0 ? 'left' : 'center';
            }

            if (data.section === 'body') {
                data.cell.styles.halign = data.column.index === 0 ? 'left' : 'center';

                // Columna Precio ARS: fondo celeste + texto azul, en negrita
                if (data.column.index === 2) {
                    data.cell.styles.fillColor = COLOR_ARS_FONDO;
                    data.cell.styles.textColor = COLOR_ARS_TEXTO;
                    data.cell.styles.fontStyle = 'bold';
                }

                // Columna Precio USD: fondo verde + texto verde oscuro, en negrita
                if (data.column.index === 3) {
                    data.cell.styles.fillColor = COLOR_USD_FONDO;
                    data.cell.styles.textColor = COLOR_USD_TEXTO;
                    data.cell.styles.fontStyle = 'bold';
                }

                // Estado: mismo color que el badge original, sin perder formato de lista
                if (data.column.index === 4) {
                    const texto = data.cell.raw.textContent.trim().toLowerCase();
                    if (texto.includes('disponible')) {
                        data.cell.styles.textColor = [30, 130, 76];
                    } else if (texto.includes('stock bajo')) {
                        data.cell.styles.textColor = [176, 128, 0];
                    } else if (texto.includes('agotado')) {
                        data.cell.styles.textColor = [190, 40, 40];
                    }
                    data.cell.styles.fontStyle = 'bold';
                }
            }
        },

        bodyStyles: {
            textColor: [50, 50, 50]
        },

        // Zebra solo en Nombre y Categoría (las columnas de precio ya tienen su propio color fijo)
        alternateRowStyles: {
            fillColor: [247, 249, 251]
        },

        columnStyles: {
            0: { halign: 'left', cellWidth: 50 },
            1: { halign: 'left', cellWidth: 33 },
            2: { halign: 'center', cellWidth: 32 },
            3: { halign: 'center', cellWidth: 30 },
            4: { halign: 'center', cellWidth: 33 }
        },

        showHead: 'everyPage',
        rowPageBreak: 'avoid'
    });

    // ============================
    // PIE DE PÁGINA
    // ============================
    const paginas = pdf.internal.getNumberOfPages();

    const ahora = new Date();
    const fechaHora = ahora.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });

    for (let i = 1; i <= paginas; i++) {

        pdf.setPage(i);

        pdf.setDrawColor(...COLOR_BORDE);
        pdf.setLineWidth(0.3);
        pdf.line(15, 283, 195, 283);

        // Generado el ... — sutil, en itálica y gris, a la izquierda del pie
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(7);
        pdf.setTextColor(150, 150, 150);
        pdf.text('Generado el ' + fechaHora, 15, 288);

        // Número de página, a la derecha
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        pdf.setTextColor(...COLOR_TEXTO_SUAVE);
        pdf.text('Página ' + i + ' de ' + paginas, 195, 288, { align: 'right' });
    }

    // ============================
    // GUARDAR / MOSTRAR
    // ============================

    // pdf.save('ListadoProductos.pdf');

    const pdfBlob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    window.open(blobUrl, '_blank');
}