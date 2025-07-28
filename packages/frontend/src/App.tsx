import { useEffect, useState } from 'react';


function App() {
    const [response, setResponse] = useState('Idle');

    useEffect(() => {
        const fetchData = async () => {
            setResponse('Loading');
            try {
                const res = await fetch('/api/hello');
                if (!res.ok) {
                    setResponse('Error: Network response was not ok');
                    throw new Error('Network response was not ok');
                }
                const data = await res.text();
                setResponse(data);
            } catch (error) {
                setResponse('Error');
                // eslint-disable-next-line no-console
                console.error('Error fetching data:', error);
            }
        };

        void fetchData();
    }, []);

    return (
        <>
            <div>Test</div>
            <p>Response: {response}</p>
        </>
    );
}
App.displayName = 'App';

export default App;
