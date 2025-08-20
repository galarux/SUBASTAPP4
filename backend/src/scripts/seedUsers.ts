import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedUsers() {
  try {
    console.log('🌱 Iniciando seed de usuarios...');

    // Crear usuarios de prueba
    const usuarios = [
      {
        email: 'usuario1@test.com',
        nombre: 'Usuario 1',
        creditos: 2000,
        orden: 1
      },
      {
        email: 'usuario2@test.com',
        nombre: 'Usuario 2',
        creditos: 2000,
        orden: 2
      },
      {
        email: 'usuario3@test.com',
        nombre: 'Usuario 3',
        creditos: 2000,
        orden: 3
      },
      {
        email: 'usuario4@test.com',
        nombre: 'Usuario 4',
        creditos: 2000,
        orden: 4
      }
    ];

    for (const usuarioData of usuarios) {
      const usuario = await prisma.usuario.upsert({
        where: { email: usuarioData.email },
        update: {},
        create: usuarioData
      });
      console.log(`✅ Usuario creado/actualizado: ${usuario.email}`);
    }

    console.log('🎉 Seed de usuarios completado exitosamente');
  } catch (error) {
    console.error('❌ Error en seed de usuarios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedUsers();
