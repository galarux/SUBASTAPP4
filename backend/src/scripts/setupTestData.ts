import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupTestData() {
  try {
    console.log('🧪 Configurando datos de prueba...\n');
    
    // 1. Verificar usuarios
    const usuarios = await prisma.usuario.findMany({
      orderBy: { id: 'asc' }
    });

    console.log('👥 Usuarios disponibles:', usuarios.length);
    usuarios.forEach(u => {
      console.log(`   ID: ${u.id} | ${u.email} | Orden: ${u.orden}`);
    });

    if (usuarios.length === 0) {
      console.log('❌ No hay usuarios disponibles');
      return;
    }

    // 2. Verificar items
    const items = await prisma.item.findMany({
      where: { subastado: false },
      orderBy: { nombre: 'asc' }
    });

    console.log('\n📝 Items disponibles:', items.length);
    items.forEach(item => {
      console.log(`   ${item.id}. ${item.nombre} - ${item.equipo}`);
    });

    if (items.length === 0) {
      console.log('❌ No hay items disponibles');
      return;
    }

    // 3. Limpiar estado anterior
    console.log('\n🧹 Limpiando estado anterior...');
    await prisma.estadoSubasta.deleteMany({});
    await prisma.puja.deleteMany({});

    // 4. Seleccionar el primer item (Messi)
    const itemToSelect = items[0];
    console.log(`\n🎯 Seleccionando item: ${itemToSelect.nombre}`);

    // 5. Crear estado de subasta activa
    const estadoSubasta = await prisma.estadoSubasta.create({
      data: {
        id: 1,
        itemActualId: itemToSelect.id,
        subastaActiva: true,
        turnoActual: 1,
        tiempoRestante: 30
      },
      include: {
        itemActual: true
      }
    });

    console.log('✅ Estado de subasta creado:', {
      itemActual: estadoSubasta.itemActual?.nombre,
      subastaActiva: estadoSubasta.subastaActiva,
      tiempoRestante: estadoSubasta.tiempoRestante
    });

    // 6. Crear puja inicial con el primer usuario
    const primerUsuario = usuarios[0];
    const pujaInicial = await prisma.puja.create({
      data: {
        itemId: itemToSelect.id,
        monto: itemToSelect.precioSalida,
        usuarioId: primerUsuario.id
      }
    });

    console.log('💰 Puja inicial creada:', {
      monto: pujaInicial.monto,
      usuario: primerUsuario.email
    });

    // 7. Verificar estado final
    const estadoFinal = await prisma.estadoSubasta.findFirst({
      where: { id: 1 },
      include: {
        itemActual: true
      }
    });

    console.log('\n📊 Estado final:');
    console.log('   Subasta activa:', estadoFinal?.subastaActiva);
    console.log('   Tiempo restante:', estadoFinal?.tiempoRestante);
    console.log('   Item actual:', estadoFinal?.itemActual?.nombre);

    const pujas = await prisma.puja.findMany({
      where: { itemId: itemToSelect.id }
    });

    console.log('   Pujas totales:', pujas.length);

    console.log('\n🎉 ¡Configuración completada!');
    console.log('💡 Ahora puedes abrir la aplicación y deberías ver:');
    console.log('   1. El jugador seleccionado en subasta');
    console.log('   2. El contador de cuenta regresiva funcionando');
    console.log('   3. Los controles de puja disponibles');

  } catch (error) {
    console.error('❌ Error en la configuración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupTestData();
