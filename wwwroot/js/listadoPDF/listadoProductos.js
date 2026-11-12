
function imprimir() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');

    // ============================
    // COLORES
    // ============================
    const COLOR_PRIMARIO = [31, 78, 121];
    const COLOR_TEXTO_SUAVE = [120, 120, 120];
    const COLOR_TEXTO_FUERTE = [45, 45, 45];
    const COLOR_BORDE = [222, 225, 229];

    const COLOR_ARS_FONDO = [227, 238, 249];
    const COLOR_ARS_TEXTO = [21, 82, 130];

    const COLOR_USD_FONDO = [227, 244, 233];
    const COLOR_USD_TEXTO = [30, 110, 70];

    // ============================
    // OBTENER Y CLONAR LA TABLA
    // ============================
    const tablaOriginal = document.querySelector(
        '#tablaInformeProductos'
    );

    if (!tablaOriginal) {
        alert('No se encontró la tabla de productos.');
        return;
    }

    const tablaClon = tablaOriginal.cloneNode(true);

    // Eliminar la columna Acción si existe
    const cabeceras = tablaOriginal.querySelectorAll('thead th');
    let indiceAccion = -1;

    cabeceras.forEach((th, i) => {
        const texto = th.textContent.trim().toLowerCase();

        if (
            texto === 'action' ||
            texto === 'actions' ||
            texto === 'acción' ||
            texto === 'acciones'
        ) {
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
    // FRANJA SUPERIOR
    // ============================
    pdf.setFillColor(...COLOR_PRIMARIO);
    pdf.rect(0, 0, 210, 6, 'F');

    // Si tenés un logo, podés insertarlo acá.
    // const imagen = document.getElementById('imgLogo');
    // pdf.addImage(imagen, 'PNG', 174, 12, 21, 14);

    // ============================
    // ENCABEZADO
    // ============================
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(...COLOR_TEXTO_FUERTE);

    pdf.text('Listado de Productos', 105, 20, {
        align: 'center'
    });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(...COLOR_TEXTO_SUAVE);

    pdf.text('Catálogo de inventario', 105, 26.5, {
        align: 'center'
    });

    pdf.setDrawColor(...COLOR_PRIMARIO);
    pdf.setLineWidth(0.5);
    pdf.line(15, 32, 195, 32);

    // ============================
    // RESUMEN DEL INVENTARIO
    // ============================
    const filasProductos = tablaOriginal.querySelectorAll(
        'tbody tr'
    );

    const cantidadProductos = filasProductos.length;
    let totalUSD = 0;

    filasProductos.forEach(row => {
        const celdaUSD = row.children[3];

        if (celdaUSD) {
            const textoUSD = celdaUSD.textContent
                .trim()
                .replace(/[^\d,.-]/g, '')
                .replace(/\./g, '')
                .replace(',', '.');

            const valor = parseFloat(textoUSD);

            if (Number.isFinite(valor)) {
                totalUSD += valor;
            }
        }
    });

    // Recuadro del resumen
    pdf.setFillColor(248, 249, 250);
    pdf.setDrawColor(...COLOR_BORDE);
    pdf.setLineWidth(0.3);

    pdf.roundedRect(15, 39, 180, 16, 2, 2, 'FD');

    // Separador
    pdf.setDrawColor(...COLOR_BORDE);
    pdf.setLineWidth(0.25);
    pdf.line(105, 42.5, 105, 51.5);

    // Cantidad de productos
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(...COLOR_TEXTO_SUAVE);

    pdf.text('TOTAL DE PRODUCTOS', 22, 45.5);

    pdf.setFontSize(13);
    pdf.setTextColor(...COLOR_TEXTO_FUERTE);

    pdf.text(String(cantidadProductos), 22, 51.5);

    // Valor total en USD
    pdf.setFontSize(8.5);
    pdf.setTextColor(...COLOR_TEXTO_SUAVE);

    pdf.text('VALOR TOTAL DEL INVENTARIO', 113, 45.5);

    pdf.setFontSize(13);
    pdf.setTextColor(...COLOR_USD_TEXTO);

    pdf.text(
        'U$D ' + totalUSD.toLocaleString('es-AR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }),
        113,
        51.5
    );

    // ============================
    // TABLA COMPACTA
    // ============================
    pdf.autoTable({
        html: tablaClon,

        startY: 62,

        theme: 'grid',

        // Reducir el espacio interno de las celdas
        styles: {
            font: 'helvetica',
            fontSize: 7.5,
            cellPadding: {
                top: 1.5,
                right: 1.5,
                bottom: 1.5,
                left: 1.5
            },
            lineWidth: 0.1,
            lineColor: COLOR_BORDE,
            valign: 'middle',
            overflow: 'linebreak'
        },

        // Encabezado de la tabla
        headStyles: {
            fillColor: COLOR_PRIMARIO,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 7.5,
            cellPadding: 2,
            valign: 'middle'
        },

        // Formato de cada celda
        didParseCell: function (data) {
            // Encabezados
            if (data.section === 'head') {
                data.cell.styles.halign =
                    data.column.index === 0 ? 'left' : 'center';
            }

            // Filas de productos
            if (data.section === 'body') {
                data.cell.styles.halign =
                    data.column.index === 0 ? 'left' : 'center';

                // Precio en pesos argentinos
                if (data.column.index === 2) {
                    data.cell.styles.fillColor = COLOR_ARS_FONDO;
                    data.cell.styles.textColor = COLOR_ARS_TEXTO;
                    data.cell.styles.fontStyle = 'bold';
                }

                // Precio en dólares
                if (data.column.index === 3) {
                    data.cell.styles.fillColor = COLOR_USD_FONDO;
                    data.cell.styles.textColor = COLOR_USD_TEXTO;
                    data.cell.styles.fontStyle = 'bold';
                }

                // Estado del producto
                if (data.column.index === 4) {
                    const celda = data.cell.raw;

                    const texto = (
                        celda && celda.textContent
                            ? celda.textContent
                            : data.cell.text.join(' ')
                    ).trim().toLowerCase();

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

        // Texto general
        bodyStyles: {
            textColor: [50, 50, 50]
        },

        // Filas alternadas
        alternateRowStyles: {
            fillColor: [247, 249, 251]
        },

        // Anchos de columnas en milímetros.
        // La suma es de 170 mm, dentro del espacio disponible.
        columnStyles: {
            0: {
                cellWidth: 40,
                halign: 'left'
            },
            1: {
                cellWidth: 32,
                halign: 'left'
            },
            2: {
                cellWidth: 30,
                halign: 'center'
            },
            3: {
                cellWidth: 30,
                halign: 'center'
            },
            4: {
                cellWidth: 30,
                halign: 'center'
            }
        },

        // Márgenes de la tabla
        margin: {
            left: 15,
            right: 15,
            bottom: 22
        },

        showHead: 'everyPage',
        rowPageBreak: 'avoid'
    });

    // ============================
    // PIE DE PÁGINA
    // ============================
    const paginas = pdf.internal.getNumberOfPages();

    const ahora = new Date();

    const fechaHora = ahora.toLocaleString('es-AR', {
        dateStyle: 'short',
        timeStyle: 'short'
    });

    for (let i = 1; i <= paginas; i++) {
        pdf.setPage(i);

        // Línea separadora
        pdf.setDrawColor(...COLOR_BORDE);
        pdf.setLineWidth(0.3);
        pdf.line(15, 283, 195, 283);

        // Fecha de generación
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(7);
        pdf.setTextColor(150, 150, 150);

        pdf.text('Generado el ' + fechaHora, 15, 288);

        // Número de página
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        pdf.setTextColor(...COLOR_TEXTO_SUAVE);

        pdf.text(
            'Página ' + i + ' de ' + paginas,
            195,
            288,
            { align: 'right' }
        );
    }

    // ============================
    // MOSTRAR PDF
    // ============================
    const pdfBlob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);

    window.open(blobUrl, '_blank');

    // Para descargarlo directamente, usá:
    // pdf.save('ListadoProductos.pdf');
}
