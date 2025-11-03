// src/app.module.ts
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import * as multer from 'multer';
import { PrismaModule } from './prisma/prisma.module';
import { UtilsModule } from './utils/utils.module';
import { ConfigModule } from '@nestjs/config';
import { WalletModule } from './wallet/wallet.module';
import { UserModule } from './user/user.module';
import { SecurityModule } from './security/security.module';
import { VehicleModule } from './vehicle/vehicle.module';
import { MessageModule } from './message/message.module';
import { ContactModule } from './contact/contact.module';
import { SliderModule } from './slider/slider.module';
import { PubliciteModule } from './publicite/publicite.module';
import { ReglageModule } from './reglage/reglage.module';
import { PartenaireModule } from './partenaire/partenaire.module';
import { PaymentMethodesModule } from './payment-methodes/payment-methodes.module';
import { TrajetModule } from './trajet/trajet.module';
import { VehicleTypeModule } from './vehicle-type/vehicle-type.module';
import { CommandeModule } from './commande/commande.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MulterModule.register({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 }, }),
    PrismaModule,
    UtilsModule,
    WalletModule,
    UserModule,
    SecurityModule,
    VehicleModule,
    MessageModule,
    ContactModule,
    SliderModule,
    PubliciteModule,
    ReglageModule,
    PartenaireModule,
    PaymentMethodesModule,
    TrajetModule,
    VehicleTypeModule,
    CommandeModule,

  ],
})
export class AppModule {}
