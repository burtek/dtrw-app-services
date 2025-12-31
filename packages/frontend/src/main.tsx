import '@radix-ui/themes/styles.css';
import { createRoot } from 'react-dom/client';

import './main.scss';
import App from './App.tsx';
import { Wrapper } from './wrapper.tsx';


const root = document.getElementById('root');

if (root) {
    createRoot(root).render(
        <Wrapper>
            <App />
        </Wrapper>
    );
}
