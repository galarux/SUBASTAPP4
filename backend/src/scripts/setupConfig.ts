import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupConfig() {
  try {
    console.log('🔧 Configurando parámetros de la aplicación...');

    // Configuración de jugadores por equipo
    await prisma.configuracion.upsert({
      where: { clave: 'jugadores_por_equipo' },
      update: { valor: '25' },
      create: {
        clave: 'jugadores_por_equipo',
        valor: '25',
        descripcion: 'Número de jugadores que debe tener cada equipo para que termine la subasta'
      }
    });

    // Configuración de tiempo de subasta (en segundos)
    await prisma.configuracion.upsert({
      where: { clave: 'tiempo_subasta' },
      update: { valor: '12' },
      create: {
        clave: 'tiempo_subasta',
        valor: '12',
        descripcion: 'Tiempo en segundos para cada subasta'
      }
    });

    // Configuración de puja mínima
    await prisma.configuracion.upsert({
      where: { clave: 'puja_minima' },
      update: { valor: '5' },
      create: {
        clave: 'puja_minima',
        valor: '5',
        descripcion: 'Incremento mínimo entre pujas'
      }
    });

    console.log('✅ Configuración completada');
    
    // Mostrar configuración actual
    const configs = await prisma.configuracion.findMany();
    console.log('\n📋 Configuración actual:');
    configs.forEach(config => {
      console.log(`  ${config.clave}: ${config.valor}${config.descripcion ? ` (${config.descripcion})` : ''}`);
    });

  } catch (error) {
    console.error('❌ Error al configurar:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupConfig();



