import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetItems() {
  try {
    console.log('🔄 Reseteando items para que estén disponibles...\n');
    
    // Resetear todos los items a no subastados
    const result = await prisma.item.updateMany({
      data: {
        subastado: false,
        ganadorId: null
      }
    });
    
    console.log(`✅ ${result.count} items reseteados`);
    
    // Verificar items disponibles
    const items = await prisma.item.findMany({
      where: { subastado: false },
      orderBy: { nombre: 'asc' }
    });
    
    console.log('\n📝 Items disponibles:', items.length);
    items.forEach(item => {
      console.log(`   ${item.id}. ${item.nombre} - ${item.equipo}`);
    });

  } catch (error) {
    console.error('❌ Error al resetear items:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetItems();
