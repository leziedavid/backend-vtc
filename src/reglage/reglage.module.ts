import { Module } from '@nestjs/common';
import { ReglageController } from './reglage.controller';
import { ReglageService } from './reglage.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CloudinaryService } from 'src/utils/cloudinary.service';
import { FunctionService } from 'src/utils/pagination.service';
import { LocalStorageService } from 'src/utils/LocalStorageService';
import { JwtStrategy } from 'src/strategies/jwt.strategy';

@Module({

    imports: [
    ConfigModule, // 👈 pour injection locale (non nécessaire si global)
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        return {
          secret: config.get<string>('JWT_SECRET'),
          signOptions: { expiresIn: config.get<string>('JWT_ACCESS_EXPIRE') || '15m' }, // par défaut 15m
        };
      }
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    PrismaModule,
  ],
  providers: [ReglageService,CloudinaryService,FunctionService,JwtStrategy,LocalStorageService],  // <-- JwtStrategy ajouté ici
  exports: [PassportModule, JwtModule],
  
  controllers: [ReglageController],
})
export class ReglageModule {}
