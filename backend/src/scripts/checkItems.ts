import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkItems() {
  try {
    console.log('📝 Verificando items disponibles...\n');
    
    // Verificar todos los items
    const items = await prisma.item.findMany({
      orderBy: { nombre: 'asc' }
    });
    
    console.log('📊 Todos los items:', items.length);
    items.forEach(item => {
      console.log(`   ${item.id}. ${item.nombre} - ${item.equipo} (Subastado: ${item.subastado})`);
    });

    // Verificar items disponibles
    const itemsDisponibles = await prisma.item.findMany({
      where: { subastado: false },
      orderBy: { nombre: 'asc' }
    });
    
    console.log('\n✅ Items disponibles:', itemsDisponibles.length);
    itemsDisponibles.forEach(item => {
      console.log(`   ${item.id}. ${item.nombre} - ${item.equipo}`);
    });

  } catch (error) {
    console.error('❌ Error al verificar items:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkItems();
