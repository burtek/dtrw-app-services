import type { ContainerInfo, NetworkInfo, Port } from 'dockerode';

import { BaseRepo } from '../database/repo';


export class DockerService extends BaseRepo {
    async getContainers() {
        const containers = await this.fastifyContext.dockerProxy?.containers;

        return containers?.map(container => this.mapContainer(container)) ?? [];
    }

    async requestRestart(id: string) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const answer = await this.fastifyContext.dockerProxy?.restartContainer(id);
            this.fastifyContext.log.info('Docker restart answer: %o', answer);
            return true;
        } catch (error) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            this.fastifyContext.log.error('Error restarting container: %o', error as Error);
            return false;
        }
    }

    private mapContainer(container: ContainerInfo) {
        return {
            id: container.Id,
            names: container.Names,
            image: container.Image,
            command: container.Command,
            ports: container.Ports.map(port => this.mapPort(port)),
            labels: container.Labels,
            state: container.State,
            status: container.Status,
            networks: this.mapNetworks(container.NetworkSettings.Networks),
            mounts: container.Mounts.map(mount => this.mapMount(mount))
        };
    }

    private mapMount(mount: ContainerInfo['Mounts'][number]) {
        return {
            type: mount.Type,
            source: mount.Source,
            destination: mount.Destination,
            mode: mount.Mode,
            rw: mount.RW
        };
    }

    private mapNetwork(network: NetworkInfo, networkName: string) {
        return {
            name: networkName,
            mac: network.MacAddress,
            networkID: network.NetworkID,
            endpointID: network.EndpointID,
            gateway: network.Gateway,
            ipAddress: network.IPAddress
        };
    }

    private mapNetworks(networks: Record<string, NetworkInfo>) {
        return Object.fromEntries(
            Object.entries(networks)
                .map(([name, info]) => [name, this.mapNetwork(info, name)])
        );
    }

    private mapPort(port: Port) {
        return {
            ip: port.IP,
            privatePort: port.PrivatePort,
            publicPort: port.PublicPort,
            type: port.Type
        };
    }
}
