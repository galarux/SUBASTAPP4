import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanAll() {
  try {
    console.log('🧹 Limpiando completamente la base de datos...\n');
    
    // 1. Limpiar todas las pujas
    console.log('🗑️ Limpiando todas las pujas...');
    const pujasEliminadas = await prisma.puja.deleteMany({});
    console.log(`✅ ${pujasEliminadas.count} pujas eliminadas`);
    
    // 2. Resetear estado de subasta
    console.log('🔄 Reseteando estado de subasta...');
    await prisma.estadoSubasta.upsert({
      where: { id: 1 },
      update: {
        itemActualId: null,
        subastaActiva: false,
        tiempoRestante: 0
      },
      create: {
        id: 1,
        itemActualId: null,
        subastaActiva: false,
        tiempoRestante: 0
      }
    });
    console.log('✅ Estado de subasta reseteado');
    
    // 3. Resetear todos los items
    console.log('🔄 Reseteando todos los items...');
    const itemsReseteados = await prisma.item.updateMany({
      data: {
        subastado: false,
        ganadorId: null
      }
    });
    console.log(`✅ ${itemsReseteados.count} items reseteados`);
    
    // 4. Resetear créditos de usuarios
    console.log('💰 Reseteando créditos de usuarios...');
    const usuariosReseteados = await prisma.usuario.updateMany({
      data: {
        creditos: 2000
      }
    });
    console.log(`✅ ${usuariosReseteados.count} usuarios reseteados`);
    
    // 5. Verificar estado final
    console.log('\n📊 Estado final:');
    
    const pujas = await prisma.puja.findMany();
    console.log(`   Pujas totales: ${pujas.length}`);
    
    const estado = await prisma.estadoSubasta.findFirst({ where: { id: 1 } });
    console.log(`   Estado subasta: ${estado ? 'Activo' : 'Inactivo'}`);
    
    const items = await prisma.item.findMany({ where: { subastado: false } });
    console.log(`   Items disponibles: ${items.length}`);
    
    const usuarios = await prisma.usuario.findMany();
    console.log(`   Usuarios: ${usuarios.length}`);
    usuarios.forEach(u => {
      console.log(`     ${u.email}: ${u.creditos} créditos`);
    });
    
    console.log('\n✅ ¡Limpieza completada!');
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanAll();
