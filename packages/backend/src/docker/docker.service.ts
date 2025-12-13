import { BaseRepo } from '../database/repo';


export class DockerService extends BaseRepo {
    async getContainers() {
        return await this.fastifyContext.dockerProxy?.containers;
    }
}
