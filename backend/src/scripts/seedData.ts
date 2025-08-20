import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedData() {
  try {
    console.log('🌱 Insertando datos de prueba...');

    // Mantener solo dos usuarios: usuario1@test.com (orden 1) y a@a.com (orden 2)
    const usuarios = await Promise.all([
      prisma.usuario.upsert({
        where: { email: 'usuario1@test.com' },
        update: {
          nombre: 'Usuario 1',
          creditos: 2000,
          orden: 1
        },
        create: {
          email: 'usuario1@test.com',
          nombre: 'Usuario 1',
          creditos: 2000,
          orden: 1
        }
      }),
      prisma.usuario.upsert({
        where: { email: 'a@a.com' },
        update: {
          nombre: 'a',
          creditos: 2000,
          orden: 2
        },
        create: {
          email: 'a@a.com',
          nombre: 'a',
          creditos: 2000,
          orden: 2
        }
      })
    ]);

    // Eliminar cualquier otro usuario que no sea los dos definidos
    const emailsPermitidos = ['usuario1@test.com', 'a@a.com'];
    const eliminados = await prisma.usuario.deleteMany({
      where: {
        email: { notIn: emailsPermitidos }
      }
    });

    console.log(`✅ Usuarios asegurados: ${usuarios.length}. Eliminados otros: ${eliminados.count}`);

    // Crear items de prueba
    const items = await Promise.all([
      prisma.item.upsert({
        where: { rapidApiId: 1001 },
        update: {},
        create: {
          rapidApiId: 1001,
          nombre: 'Lionel Messi',
          equipo: 'Inter Miami',
          posicion: 'DELANTERO',
          nacionalidad: 'Argentina',
          peso: '72 kg',
          altura: '1.70 m',
          lesionado: false,
          fotoUrl: 'https://via.placeholder.com/150x150?text=Messi',
          precioSalida: 5,
          subastado: false
        }
      }),
      prisma.item.upsert({
        where: { rapidApiId: 1002 },
        update: {},
        create: {
          rapidApiId: 1002,
          nombre: 'Cristiano Ronaldo',
          equipo: 'Al Nassr',
          posicion: 'DELANTERO',
          nacionalidad: 'Portugal',
          peso: '84 kg',
          altura: '1.87 m',
          lesionado: false,
          fotoUrl: 'https://via.placeholder.com/150x150?text=Ronaldo',
          precioSalida: 5,
          subastado: false
        }
      }),
      prisma.item.upsert({
        where: { rapidApiId: 1003 },
        update: {},
        create: {
          rapidApiId: 1003,
          nombre: 'Kevin De Bruyne',
          equipo: 'Manchester City',
          posicion: 'MEDIO',
          nacionalidad: 'Bélgica',
          peso: '70 kg',
          altura: '1.81 m',
          lesionado: false,
          fotoUrl: 'https://via.placeholder.com/150x150?text=DeBruyne',
          precioSalida: 5,
          subastado: false
        }
      }),
      prisma.item.upsert({
        where: { rapidApiId: 1004 },
        update: {},
        create: {
          rapidApiId: 1004,
          nombre: 'Virgil van Dijk',
          equipo: 'Liverpool',
          posicion: 'DEFENSA',
          nacionalidad: 'Países Bajos',
          peso: '92 kg',
          altura: '1.93 m',
          lesionado: false,
          fotoUrl: 'https://via.placeholder.com/150x150?text=VanDijk',
          precioSalida: 5,
          subastado: false
        }
      }),
      prisma.item.upsert({
        where: { rapidApiId: 1005 },
        update: {},
        create: {
          rapidApiId: 1005,
          nombre: 'Thibaut Courtois',
          equipo: 'Real Madrid',
          posicion: 'PORTERO',
          nacionalidad: 'Bélgica',
          peso: '96 kg',
          altura: '1.99 m',
          lesionado: false,
          fotoUrl: 'https://via.placeholder.com/150x150?text=Courtois',
          precioSalida: 5,
          subastado: false
        }
      })
    ]);

    console.log('✅ Items creados:', items.length);

    console.log('🎉 Datos de prueba insertados correctamente!');
  } catch (error) {
    console.error('❌ Error al insertar datos de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedData();
