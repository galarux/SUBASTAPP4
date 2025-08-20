import { PrismaClient } from '@prisma/client';
import { Server as SocketIOServer } from 'socket.io';
import { io as socketIOClient } from 'socket.io-client';
import { getRandomPlayerImages } from './getPlayerImages';

const prisma = new PrismaClient();

async function resetAuction() {
  try {
    console.log('🔄 Reiniciando subasta y cerrando todas las sesiones...\n');
    
    // 1. Limpiar estado de subasta
    console.log('🗑️ Limpiando estado de subasta...');
    await prisma.estadoSubasta.deleteMany({});
    console.log('✅ Estado de subasta limpiado');

    // 2. Limpiar todas las pujas (debe ir antes de eliminar items)
    console.log('🗑️ Limpiando todas las pujas...');
    await prisma.puja.deleteMany({});
    console.log('✅ Pujas limpiadas');

    // 2.1. Resetear campo salioDePuja de todos los usuarios
    console.log('🔄 Reseteando campo salioDePuja...');
    await prisma.usuario.updateMany({
      data: { salioDePuja: false }
    });
    console.log('✅ Campo salioDePuja reseteado');

    // 3. Limpiar referencias a items antes de eliminarlos
    console.log('🗑️ Limpiando referencias a items...');
    await prisma.estadoSubasta.updateMany({
      data: { itemActualId: null }
    });
    console.log('✅ Referencias limpiadas');

    // 4. Eliminar todos los items existentes
    console.log('🗑️ Eliminando todos los items existentes...');
    await prisma.item.deleteMany({});
    console.log('✅ Items eliminados');

    // 5. Insertar 50 jugadores nuevos con imágenes aleatorias
    console.log('🎯 Insertando 50 jugadores nuevos...');
    const jugadores = [
      // Delanteros
      { nombre: 'Erling Haaland', equipo: 'Manchester City', posicion: 'DELANTERO', nacionalidad: 'Noruega', precioSalida: 15 },
      { nombre: 'Kylian Mbappé', equipo: 'Real Madrid', posicion: 'DELANTERO', nacionalidad: 'Francia', precioSalida: 20 },
      { nombre: 'Harry Kane', equipo: 'Bayern Munich', posicion: 'DELANTERO', nacionalidad: 'Inglaterra', precioSalida: 18 },
      { nombre: 'Victor Osimhen', equipo: 'Napoli', posicion: 'DELANTERO', nacionalidad: 'Nigeria', precioSalida: 16 },
      { nombre: 'Lautaro Martínez', equipo: 'Inter Milan', posicion: 'DELANTERO', nacionalidad: 'Argentina', precioSalida: 14 },
      { nombre: 'Darwin Núñez', equipo: 'Liverpool', posicion: 'DELANTERO', nacionalidad: 'Uruguay', precioSalida: 12 },
      { nombre: 'Gabriel Jesus', equipo: 'Arsenal', posicion: 'DELANTERO', nacionalidad: 'Brasil', precioSalida: 10 },
      { nombre: 'Julian Alvarez', equipo: 'Manchester City', posicion: 'DELANTERO', nacionalidad: 'Argentina', precioSalida: 11 },
      { nombre: 'Rafael Leão', equipo: 'AC Milan', posicion: 'DELANTERO', nacionalidad: 'Portugal', precioSalida: 13 },
      { nombre: 'Vinicius Jr', equipo: 'Real Madrid', posicion: 'DELANTERO', nacionalidad: 'Brasil', precioSalida: 17 },

      // Mediocampistas
      { nombre: 'Jude Bellingham', equipo: 'Real Madrid', posicion: 'MEDIO', nacionalidad: 'Inglaterra', precioSalida: 19 },
      { nombre: 'Phil Foden', equipo: 'Manchester City', posicion: 'MEDIO', nacionalidad: 'Inglaterra', precioSalida: 16 },
      { nombre: 'Pedri', equipo: 'Barcelona', posicion: 'MEDIO', nacionalidad: 'España', precioSalida: 15 },
      { nombre: 'Gavi', equipo: 'Barcelona', posicion: 'MEDIO', nacionalidad: 'España', precioSalida: 14 },
      { nombre: 'Federico Valverde', equipo: 'Real Madrid', posicion: 'MEDIO', nacionalidad: 'Uruguay', precioSalida: 13 },
      { nombre: 'Enzo Fernández', equipo: 'Chelsea', posicion: 'MEDIO', nacionalidad: 'Argentina', precioSalida: 12 },
      { nombre: 'Declan Rice', equipo: 'Arsenal', posicion: 'MEDIO', nacionalidad: 'Inglaterra', precioSalida: 11 },
      { nombre: 'Moises Caicedo', equipo: 'Chelsea', posicion: 'MEDIO', nacionalidad: 'Ecuador', precioSalida: 10 },
      { nombre: 'Aurélien Tchouaméni', equipo: 'Real Madrid', posicion: 'MEDIO', nacionalidad: 'Francia', precioSalida: 12 },
      { nombre: 'Eduardo Camavinga', equipo: 'Real Madrid', posicion: 'MEDIO', nacionalidad: 'Francia', precioSalida: 11 },
      { nombre: 'Johan Bakayoko', equipo: 'PSV Eindhoven', posicion: 'MEDIO', nacionalidad: 'Bélgica', precioSalida: 9 },
      { nombre: 'Xavi Simons', equipo: 'RB Leipzig', posicion: 'MEDIO', nacionalidad: 'Países Bajos', precioSalida: 10 },
      { nombre: 'Warren Zaïre-Emery', equipo: 'PSG', posicion: 'MEDIO', nacionalidad: 'Francia', precioSalida: 11 },
      { nombre: 'Cole Palmer', equipo: 'Chelsea', posicion: 'MEDIO', nacionalidad: 'Inglaterra', precioSalida: 10 },

      // Defensas
      { nombre: 'William Saliba', equipo: 'Arsenal', posicion: 'DEFENSA', nacionalidad: 'Francia', precioSalida: 12 },
      { nombre: 'Ronald Araújo', equipo: 'Barcelona', posicion: 'DEFENSA', nacionalidad: 'Uruguay', precioSalida: 11 },
      { nombre: 'Josko Gvardiol', equipo: 'Manchester City', posicion: 'DEFENSA', nacionalidad: 'Croacia', precioSalida: 13 },
      { nombre: 'Alessandro Bastoni', equipo: 'Inter Milan', posicion: 'DEFENSA', nacionalidad: 'Italia', precioSalida: 10 },
      { nombre: 'Matthijs de Ligt', equipo: 'Bayern Munich', posicion: 'DEFENSA', nacionalidad: 'Países Bajos', precioSalida: 11 },
      { nombre: 'Dayot Upamecano', equipo: 'Bayern Munich', posicion: 'DEFENSA', nacionalidad: 'Francia', precioSalida: 10 },
      { nombre: 'Antonio Silva', equipo: 'Benfica', posicion: 'DEFENSA', nacionalidad: 'Portugal', precioSalida: 9 },
      { nombre: 'Gonçalo Inácio', equipo: 'Sporting CP', posicion: 'DEFENSA', nacionalidad: 'Portugal', precioSalida: 8 },
      { nombre: 'Levi Colwill', equipo: 'Chelsea', posicion: 'DEFENSA', nacionalidad: 'Inglaterra', precioSalida: 9 },
      { nombre: 'Micky van de Ven', equipo: 'Tottenham', posicion: 'DEFENSA', nacionalidad: 'Países Bajos', precioSalida: 8 },
      { nombre: 'Jarrad Branthwaite', equipo: 'Everton', posicion: 'DEFENSA', nacionalidad: 'Inglaterra', precioSalida: 7 },
      { nombre: 'Leny Yoro', equipo: 'Lille', posicion: 'DEFENSA', nacionalidad: 'Francia', precioSalida: 8 },
      { nombre: 'Arthur Theate', equipo: 'Rennes', posicion: 'DEFENSA', nacionalidad: 'Bélgica', precioSalida: 7 },

      // Porteros
      { nombre: 'Mike Maignan', equipo: 'AC Milan', posicion: 'PORTERO', nacionalidad: 'Francia', precioSalida: 10 },
      { nombre: 'Emiliano Martínez', equipo: 'Aston Villa', posicion: 'PORTERO', nacionalidad: 'Argentina', precioSalida: 9 },
      { nombre: 'Alisson', equipo: 'Liverpool', posicion: 'PORTERO', nacionalidad: 'Brasil', precioSalida: 11 },
      { nombre: 'Ederson', equipo: 'Manchester City', posicion: 'PORTERO', nacionalidad: 'Brasil', precioSalida: 10 },
      { nombre: 'Marc-André ter Stegen', equipo: 'Barcelona', posicion: 'PORTERO', nacionalidad: 'Alemania', precioSalida: 9 },
      { nombre: 'Jan Oblak', equipo: 'Atlético Madrid', posicion: 'PORTERO', nacionalidad: 'Eslovenia', precioSalida: 8 },
      { nombre: 'Gianluigi Donnarumma', equipo: 'PSG', posicion: 'PORTERO', nacionalidad: 'Italia', precioSalida: 9 },
      { nombre: 'David Raya', equipo: 'Arsenal', posicion: 'PORTERO', nacionalidad: 'España', precioSalida: 7 },
      { nombre: 'Guglielmo Vicario', equipo: 'Tottenham', posicion: 'PORTERO', nacionalidad: 'Italia', precioSalida: 6 },
      { nombre: 'Bart Verbruggen', equipo: 'Brighton', posicion: 'PORTERO', nacionalidad: 'Países Bajos', precioSalida: 5 },
      { nombre: 'Anatoliy Trubin', equipo: 'Benfica', posicion: 'PORTERO', nacionalidad: 'Ucrania', precioSalida: 6 },
      { nombre: 'Diogo Costa', equipo: 'Porto', posicion: 'PORTERO', nacionalidad: 'Portugal', precioSalida: 7 },
      { nombre: 'Giorgi Mamardashvili', equipo: 'Valencia', posicion: 'PORTERO', nacionalidad: 'Georgia', precioSalida: 5 },
      { nombre: 'Lucas Chevalier', equipo: 'Lille', posicion: 'PORTERO', nacionalidad: 'Francia', precioSalida: 4 }
    ];

    // Obtener imágenes aleatorias para todos los jugadores
    const imagenesAleatorias = getRandomPlayerImages(jugadores.length);
    
    // Insertar jugadores con imágenes aleatorias
    for (let i = 0; i < jugadores.length; i++) {
      const jugador = jugadores[i];
      await prisma.item.create({
        data: {
          rapidApiId: Math.floor(Math.random() * 1000000) + 1000000,
          nombre: jugador.nombre,
          equipo: jugador.equipo,
          posicion: jugador.posicion,
          nacionalidad: jugador.nacionalidad,
          precioSalida: jugador.precioSalida,
          subastado: false,
          fotoUrl: imagenesAleatorias[i]
        }
      });
    }
    console.log(`✅ ${jugadores.length} jugadores insertados con imágenes aleatorias`);

    // 6. Resetear créditos de todos los usuarios
    console.log('💰 Reseteando créditos...');
    await prisma.usuario.updateMany({
      data: { creditos: 2000 }
    });
    console.log('✅ Créditos reseteados a 2000');

    // 7. Emitir evento de reinicio a través de Socket.IO
    console.log('🔌 Emitiendo evento de reinicio a todos los usuarios...');
    try {
      const socket = socketIOClient('http://localhost:3001');
      
      socket.on('connect', () => {
        console.log('✅ Conectado al servidor Socket.IO');
        
        // Emitir evento de reinicio
        socket.emit('admin-reset-auction', {
          message: 'La subasta ha sido reiniciada por el administrador. Por favor, recarga la página.',
          timestamp: new Date().toISOString()
        });
        
        console.log('✅ Evento de reinicio emitido');
        
        // Desconectar después de emitir
        setTimeout(() => {
          socket.disconnect();
          console.log('✅ Desconectado del servidor Socket.IO');
        }, 1000);
      });
      
      socket.on('connect_error', (error: any) => {
        console.log('⚠️ No se pudo conectar al servidor Socket.IO:', error.message);
        console.log('ℹ️ Los usuarios deberán recargar manualmente la página');
      });
      
    } catch (error) {
      console.log('⚠️ Error al emitir evento de reinicio:', error);
      console.log('ℹ️ Los usuarios deberán recargar manualmente la página');
    }

    // 8. Verificar estado final
    console.log('\n📊 Estado final:');
    
    const usuarios = await prisma.usuario.findMany({
      orderBy: { orden: 'asc' }
    });
    console.log('👥 Usuarios:');
    usuarios.forEach((usuario) => {
      console.log(`   ${usuario.orden}. ${usuario.email} - ${usuario.creditos} créditos`);
    });

    const items = await prisma.item.findMany({
      orderBy: { nombre: 'asc' }
    });
    console.log('\n📝 Items disponibles:');
    items.forEach((item) => {
      console.log(`   ${item.id}. ${item.nombre} - ${item.equipo}`);
    });

    const pujas = await prisma.puja.findMany();
    console.log(`\n💰 Pujas totales: ${pujas.length}`);

    const estados = await prisma.estadoSubasta.findMany();
    console.log(`📊 Estados de subasta: ${estados.length}`);

    console.log('\n✅ Reinicio completado!');
    console.log('\n🎯 Próximos pasos:');
    console.log('1. Los usuarios deberán recargar la página');
    console.log('2. Inicia sesión con usuario1@test.com');
    console.log('3. Selecciona cualquier jugador para subastar');
    console.log('4. Todos los usuarios pueden pujar por el jugador seleccionado');
    console.log('5. Cada jugador tiene una imagen aleatoria asignada');

  } catch (error) {
    console.error('❌ Error al reiniciar subasta:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAuction();
