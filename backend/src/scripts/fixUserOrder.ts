import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixUserOrder() {
  try {
    console.log('🔧 Arreglando orden de usuarios...\n');
    
    // Actualizar el orden de los usuarios
    await prisma.usuario.updateMany({
      where: { email: 'usuario1@test.com' },
      data: { orden: 1 }
    });

    await prisma.usuario.updateMany({
      where: { email: 'a@a.com' },
      data: { orden: 2 }
    });

    await prisma.usuario.updateMany({
      where: { email: 'usuario2@test.com' },
      data: { orden: 3 }
    });

    await prisma.usuario.updateMany({
      where: { email: 'usuario3@test.com' },
      data: { orden: 4 }
    });

    console.log('✅ Orden de usuarios actualizado:\n');
    console.log('1. usuario1@test.com (orden: 1)');
    console.log('2. a@a.com (orden: 2)');
    console.log('3. usuario2@test.com (orden: 3)');
    console.log('4. usuario3@test.com (orden: 4)');

    // Verificar que se arregló
    const usuarios = await prisma.usuario.findMany({
      orderBy: { orden: 'asc' }
    });

    console.log('\n📊 Verificación final:');
    usuarios.forEach((usuario) => {
      console.log(`   ${usuario.orden}. ${usuario.email} (ID: ${usuario.id})`);
    });

  } catch (error) {
    console.error('❌ Error al arreglar orden de usuarios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserOrder();
