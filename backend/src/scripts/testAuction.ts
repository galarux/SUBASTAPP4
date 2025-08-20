import { PrismaClient } from '@prisma/client';
import { io as Client } from 'socket.io-client';

const prisma = new PrismaClient();

async function testAuction() {
  try {
    console.log('🧪 Iniciando prueba de subasta...\n');
    
    // 1. Verificar estado inicial
    console.log('📊 Estado inicial:');
    const estadoInicial = await prisma.estadoSubasta.findFirst({
      where: { id: 1 },
      include: { itemActual: true }
    });
    console.log('Estado de subasta:', estadoInicial);
    
    const items = await prisma.item.findMany({
      where: { subastado: false },
      orderBy: { nombre: 'asc' }
    });
    console.log('Items disponibles:', items.length);
    
    // 2. Conectar cliente Socket.IO
    console.log('\n🔌 Conectando cliente Socket.IO...');
    const socket = Client('http://localhost:3001');
    
    socket.on('connect', () => {
      console.log('✅ Cliente conectado:', socket.id);
      
      // 3. Unirse a la subasta
      console.log('\n📨 Uniéndose a la subasta...');
      socket.emit('join-auction', { usuarioId: 2 }); // usuario1@test.com
    });
    
    // 4. Escuchar eventos
    socket.on('auction-started', (data) => {
      console.log('🚀 Subasta iniciada:', data);
    });
    
    socket.on('time-update', (data) => {
      console.log('⏰ Actualización de tiempo:', data);
    });
    
    socket.on('new-bid', (data) => {
      console.log('💰 Nueva puja:', data);
    });
    
    socket.on('auction-ended', (data) => {
      console.log('🏁 Subasta finalizada:', data);
    });
    
    // 5. Esperar un momento y seleccionar item
    setTimeout(async () => {
      console.log('\n🎯 Seleccionando Messi para subastar...');
      socket.emit('select-item', { itemId: 1 }); // Messi
      
      // 6. Esperar y hacer una puja
      setTimeout(() => {
        console.log('\n💰 Haciendo puja de 10 créditos...');
        socket.emit('place-bid', { 
          itemId: 1, 
          monto: 10, 
          usuarioId: 4 // a@a.com
        });
        
        // 7. Esperar y hacer otra puja
        setTimeout(() => {
          console.log('\n💰 Haciendo segunda puja de 15 créditos...');
          socket.emit('place-bid', { 
            itemId: 1, 
            monto: 15, 
            usuarioId: 2 // usuario1@test.com
          });
          
          // 8. Esperar y desconectar
          setTimeout(() => {
            console.log('\n🔌 Desconectando cliente...');
            socket.disconnect();
            process.exit(0);
          }, 5000);
        }, 3000);
      }, 3000);
    }, 2000);
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
    process.exit(1);
  }
}

testAuction();
