import { Injectable } from '@nestjs/common';

import * as packageJson from '../package.json';


@Injectable()
export class HealthService {
    getVersion(): string {
        return packageJson.version;
    }
}
