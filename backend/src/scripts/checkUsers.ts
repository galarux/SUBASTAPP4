import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('👥 Verificando usuarios en la base de datos...\n');
    
    const usuarios = await prisma.usuario.findMany({
      orderBy: { id: 'asc' }
    });

    console.log('📊 Usuarios encontrados:', usuarios.length);
    
    if (usuarios.length === 0) {
      console.log('❌ No hay usuarios en la base de datos');
      return;
    }

    usuarios.forEach(usuario => {
      console.log(`   ID: ${usuario.id} | Email: ${usuario.email} | Nombre: ${usuario.nombre} | Créditos: ${usuario.creditos} | Orden: ${usuario.orden}`);
    });

    console.log('\n💡 Usar el primer usuario para pujas del sistema');

  } catch (error) {
    console.error('❌ Error al verificar usuarios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
