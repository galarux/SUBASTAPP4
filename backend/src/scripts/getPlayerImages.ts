import * as fs from 'fs';
import * as path from 'path';

// Función para obtener todas las imágenes de jugadores disponibles
export function getPlayerImages(): string[] {
  try {
    const imagesPath = path.join(__dirname, '../../../frontend/img/jugadores');
    
    if (!fs.existsSync(imagesPath)) {
      console.log('⚠️ No se encontró la carpeta de imágenes de jugadores');
      return [];
    }

    const files = fs.readdirSync(imagesPath);
    const imageFiles = files.filter(file => 
      file.toLowerCase().endsWith('.png') || 
      file.toLowerCase().endsWith('.jpg') || 
      file.toLowerCase().endsWith('.jpeg')
    );

    console.log(`📸 Encontradas ${imageFiles.length} imágenes de jugadores`);
    return imageFiles;
  } catch (error) {
    console.error('❌ Error al leer imágenes de jugadores:', error);
    return [];
  }
}

// Función para obtener una imagen aleatoria
export function getRandomPlayerImage(): string {
  const images = getPlayerImages();
  
  if (images.length === 0) {
    // Fallback a imagen placeholder si no hay imágenes locales
    return 'https://via.placeholder.com/150x150?text=Jugador';
  }

  const randomImage = images[Math.floor(Math.random() * images.length)];
  return `/img/jugadores/${randomImage}`;
}

// Función para obtener múltiples imágenes aleatorias
export function getRandomPlayerImages(count: number): string[] {
  const images = getPlayerImages();
  
  if (images.length === 0) {
    // Fallback a imágenes placeholder
    return Array(count).fill('https://via.placeholder.com/150x150?text=Jugador');
  }

  const selectedImages: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const randomImage = images[Math.floor(Math.random() * images.length)];
    selectedImages.push(`/img/jugadores/${randomImage}`);
  }

  return selectedImages;
}
