import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugEstado() {
  try {
    console.log('🔍 Debuggeando estado de subasta...\n');
    
    // Verificar todos los estados
    const estados = await prisma.estadoSubasta.findMany();
    console.log('📊 Estados encontrados:', estados.length);
    estados.forEach((estado, index) => {
      console.log(`   ${index + 1}. ID: ${estado.id}, ItemID: ${estado.itemActualId}, Activa: ${estado.subastaActiva}`);
    });

    // Verificar el primer estado con item
    const estadoConItem = await prisma.estadoSubasta.findFirst({
      include: {
        itemActual: true
      }
    });
    
    if (estadoConItem) {
      console.log('\n✅ Estado con item encontrado:');
      console.log(JSON.stringify(estadoConItem, null, 2));
    } else {
      console.log('\n❌ No hay estado con item');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugEstado();
