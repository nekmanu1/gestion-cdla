function normalizarNombreCliente(valor = '') {
    return String(valor)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function distanciaLevenshtein(a, b) {
    const textoA = normalizarNombreCliente(a);
    const textoB = normalizarNombreCliente(b);

    const matriz = Array.from(
        { length: textoB.length + 1 },
        () => Array(textoA.length + 1).fill(0)
    );

    for (let i = 0; i <= textoB.length; i += 1) {
        matriz[i][0] = i;
    }

    for (let j = 0; j <= textoA.length; j += 1) {
        matriz[0][j] = j;
    }

    for (let i = 1; i <= textoB.length; i += 1) {
        for (let j = 1; j <= textoA.length; j += 1) {
            const costo = textoB[i - 1] === textoA[j - 1] ? 0 : 1;

            matriz[i][j] = Math.min(
                matriz[i - 1][j] + 1,
                matriz[i][j - 1] + 1,
                matriz[i - 1][j - 1] + costo
            );
        }
    }

    return matriz[textoB.length][textoA.length];
}

function calcularSimilitudNombre(a, b) {
    const textoA = normalizarNombreCliente(a);
    const textoB = normalizarNombreCliente(b);

    if (!textoA || !textoB) return 0;
    if (textoA === textoB) return 1;

    const longitudMayor = Math.max(textoA.length, textoB.length);

    if (longitudMayor === 0) return 1;

    return 1 - distanciaLevenshtein(textoA, textoB) / longitudMayor;
}

async function buscarClientePorNombreSimilar(
    prismaOTransaccion,
    nombre,
    excluirId = null
) {
    const nombreNormalizado = normalizarNombreCliente(nombre);

    if (!nombreNormalizado) return null;

    /*
     * Primero se busca una coincidencia que solo difiera
     * entre mayúsculas y minúsculas.
     */
    const coincidenciaExacta = await prismaOTransaccion.cliente.findFirst({
        where: {
            nombre: {
                equals: nombre.trim(),
                mode: 'insensitive'
            },
            ...(excluirId
                ? {
                    id: {
                        not: Number(excluirId)
                    }
                }
                : {})
        }
    });

    if (coincidenciaExacta) {
        return {
            cliente: coincidenciaExacta,
            similitud: 1,
            tipo: 'EXACTO'
        };
    }

    /*
     * Para detectar diferencias de espacios, acentos,
     * abreviaciones pequeñas o errores mínimos.
     */
    const clientes = await prismaOTransaccion.cliente.findMany({
        where: excluirId
            ? {
                id: {
                    not: Number(excluirId)
                }
            }
            : undefined,
        select: {
            id: true,
            nombre: true,
            cedulaRuc: true,
            telefono: true,
            correo: true,
            contactoResponsable: true,
            activo: true
        }
    });

    let mejorCoincidencia = null;

    for (const cliente of clientes) {
        const similitud = calcularSimilitudNombre(
            nombreNormalizado,
            cliente.nombre
        );

        /*
         * 0.88 evita registrar nombres como:
         * "Fundación Cultural Panamá"
         * "fundacion cultural panama"
         * "Fundación Cultural de Panamá"
         */
        if (
            similitud >= 0.88 &&
            (!mejorCoincidencia ||
                similitud > mejorCoincidencia.similitud)
        ) {
            mejorCoincidencia = {
                cliente,
                similitud,
                tipo: 'PARECIDO'
            };
        }
    }

    return mejorCoincidencia;
}

module.exports = {
    normalizarNombreCliente,
    calcularSimilitudNombre,
    buscarClientePorNombreSimilar
};