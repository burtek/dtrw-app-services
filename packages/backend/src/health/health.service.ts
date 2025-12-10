import packageJson from '../../package.json' with { type: 'json' };
import { BaseRepo } from '../database/repo';


export class HealthService extends BaseRepo {
    getVersion(): string {
        return packageJson.version;
    }
}
