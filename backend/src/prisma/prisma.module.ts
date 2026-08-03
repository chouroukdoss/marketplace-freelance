import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // 💡 L'ajout de @Global() permet de le rendre disponible partout sans l'importer à chaque fois
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // 👈 C'est cette ligne qui est cruciale
})
export class PrismaModule {}