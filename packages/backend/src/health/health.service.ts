import packageJson from '../../package.json' with { type: 'json' };


export class HealthService {
    getVersion(): string {
        return packageJson.version;
    }
}
