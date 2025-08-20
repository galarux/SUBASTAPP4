import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkEstado() {
  try {
    console.log('�� Verificando estado de la subasta...\n');
    
    // Verificar si existe algún estado de subasta
    const estadoSubasta = await prisma.estadoSubasta.findFirst({
      where: { id: 1 },
      include: {
        itemActual: true
      }
    });

    console.log('📊 Estado actual de subasta:', estadoSubasta);

    if (!estadoSubasta) {
      console.log('⚠️ No hay estado de subasta, creando uno inicial...');
      
      // Crear estado inicial
      const nuevoEstado = await prisma.estadoSubasta.create({
        data: {
          id: 1,
          subastaActiva: false,
          turnoActual: 1,
          tiempoRestante: 30
        }
      });
      
      console.log('✅ Estado inicial creado:', nuevoEstado);
    } else {
      console.log('✅ Estado de subasta existe');
    }

    // Verificar usuarios
    const usuarios = await prisma.usuario.findMany({
      orderBy: { orden: 'asc' }
    });
    console.log('\n👥 Usuarios:', usuarios.length);
    usuarios.forEach(u => {
      console.log(`   ${u.orden}. ${u.email} - ${u.creditos} créditos`);
    });

    // Verificar items
    const items = await prisma.item.findMany({
      where: { subastado: false },
      orderBy: { nombre: 'asc' }
    });
    console.log('\n📝 Items disponibles:', items.length);
    items.forEach(item => {
      console.log(`   ${item.id}. ${item.nombre} - ${item.equipo}`);
    });

    // Verificar pujas
    const pujas = await prisma.puja.findMany();
    console.log('\n💰 Pujas totales:', pujas.length);

  } catch (error) {
    console.error('❌ Error al verificar estado:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEstado();
