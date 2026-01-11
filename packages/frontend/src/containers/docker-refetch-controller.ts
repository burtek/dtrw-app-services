import { useGetDockerContainersQuery } from './api-docker';


export const DockerRefetchController = () => {
    useGetDockerContainersQuery(undefined, { pollingInterval: 10_000 });
    return null;
};
DockerRefetchController.displayName = 'DockerRefetchController';
