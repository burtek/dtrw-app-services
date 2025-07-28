import { Controller, Get } from '@nestjs/common';

import { HealthService } from './health.service';


// in future replace with https://docs.nestjs.com/recipes/terminus

@Controller('health')
export class HealthController {
    constructor(private readonly healthService: HealthService) {
    }

    @Get()
    getHealth() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(), // seconds
            commit: process.env.COMMIT_SHA ?? 'dev',
            version: this.healthService.getVersion(),
            nodeVersion: process.version,
            memoryUsage: process.memoryUsage(),
            cpuUsage: process.cpuUsage(),
            platform: process.platform,
            arch: process.arch,
            freeMemory: process.memoryUsage().heapTotal - process.memoryUsage().heapUsed
        };
    }
}
