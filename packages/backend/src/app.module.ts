import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';


@Module({
    imports: [],
    controllers: [AppController, HealthController],
    providers: [AppService, HealthService]
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AppModule {
}
