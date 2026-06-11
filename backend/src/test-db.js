const prisma = require('./lib/prisma');

async function main() {
    const usuarios = await prisma.usuario.findMany();

    console.log('Conexión correcta');
    console.log('Usuarios encontrados:', usuarios.length);
}

main()
    .catch((error) => {
        console.error(error);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });