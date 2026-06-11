const bcrypt = require('bcryptjs');
const prisma = require('./lib/prisma');

async function main() {
    const passwordHash = await bcrypt.hash('Admin12345', 10);

    const admin = await prisma.usuario.upsert({
        where: {
            email: 'admin@cdla.com'
        },
        update: {},
        create: {
            nombre: 'Administrador',
            email: 'admin@cdla.com',
            password: passwordHash,
            rol: 'ADMIN',
            activo: true
        }
    });

    console.log('Administrador creado correctamente:');
    console.log(admin.email);
    console.log('Contraseña: Admin12345');
}

main()
    .catch((error) => {
        console.error(error);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });