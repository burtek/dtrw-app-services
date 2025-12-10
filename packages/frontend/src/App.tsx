import { useEffect, useState } from 'react';


function App() {
    const [users, setUsers] = useState<Record<string, Record<string, unknown>>>({});
    const [acl, setACL] = useState<Array<Record<string, unknown>>>([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch('/api/users');
                setUsers(await res.json());
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error('Error fetching data:', error);
            }
        };
        const fetchACL = async () => {
            try {
                const res = await fetch('/api/access-control');
                setACL(await res.json());
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error('Error fetching data:', error);
            }
        };

        void fetchUsers();
        void fetchACL();
    }, []);

    return (
        <>
            <h2>Użytkownicy</h2>
            <p>
                {Object.keys(users)
                    .map(id => ({ id, ...users[id] }))
                    .map(datum => (
                        <li key={datum.id}>
                            <pre>{JSON.stringify(datum, undefined, 4)}</pre>
                        </li>
                    ))}
            </p>
            <h2>ACL</h2>
            <p>
                {acl
                    .map((datum, index) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <li key={index}>
                            <pre>{JSON.stringify(datum, undefined, 4)}</pre>
                        </li>
                    ))}
            </p>
        </>
    );
}
App.displayName = 'App';

export default App;
