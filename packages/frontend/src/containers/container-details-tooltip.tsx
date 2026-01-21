/* eslint-disable @stylistic/jsx-one-expression-per-line */
import { Text } from '@radix-ui/themes';

import type { DockerContainer, WithId } from '../types';


export const getTooltipContent = (dockerContainer: WithId<DockerContainer, string>) =>
    (
        <>
            <Text as="p">Command: {dockerContainer.command}</Text>
            <Text as="p">Ports:</Text>
            <ul>
                {dockerContainer.ports.map((port, index) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <li key={index}>
                        {port.publicPort
                            ? `Type: ${port.type} - app:${port.privatePort} -> world:${port.publicPort} / ip ${port.ip}`
                            : `Type: ${port.type} - app:${port.privatePort} on docker network only`}
                    </li>
                ))}
            </ul>
            <Text as="p">Networks: {Object.keys(dockerContainer.networks).join(', ')}</Text>
            <Text as="p">Labels:</Text>
            <ul>
                {Object.entries(dockerContainer.labels).map(([key, value]) =>
                    <li key={key}>{key}: {value}</li>)}
            </ul>
        </>
    );
