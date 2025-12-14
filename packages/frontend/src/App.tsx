import { useEffect, useState } from 'react';


type Obj = Record<string, unknown>;

const useApi = <T,>(path: string, defaultValue: T) => {
    const [data, setData] = useState<T>(defaultValue);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(path);
                setData(await res.json());
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error(`Error fetching data from ${path}:`, error);
            }
        };

        void fetchData();
    }, []);

    return data;
};

function App() {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const acl = useApi<{ default_policy?: string; rules: Obj[] }>('/api/access-control', { rules: [] });
    const users = useApi<Record<string, Obj>>('/api/users', {});
    const containers = useApi<Obj[]>('/api/docker/containers', []);

    return (
        <>
            <h2>Użytkownicy</h2>
            <ul>
                {Object.keys(users)
                    .map(id => ({ id, ...users[id] }))
                    .map(datum => (
                        <li key={datum.id}>
                            <pre>{JSON.stringify(datum, undefined, 4)}</pre>
                        </li>
                    ))}
            </ul>
            <h2>
                {`ACL (default: ${acl.default_policy ?? '?'})`}
            </h2>
            <ul>
                {acl.rules
                    .map((datum, index) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <li key={index}>
                            <pre>{JSON.stringify(datum, undefined, 4)}</pre>
                        </li>
                    ))}
            </ul>
            <h2>Kontenery</h2>
            <ul>
                {containers
                    .map((datum, index) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <li key={index}>
                            <pre>{JSON.stringify(datum, undefined, 4)}</pre>
                        </li>
                    ))}
            </ul>
        </>
    );
}
App.displayName = 'App';

export default App;
