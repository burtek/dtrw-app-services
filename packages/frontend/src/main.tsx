import '@radix-ui/themes/styles.css';
import { createRoot } from 'react-dom/client';

import './main.scss';
import App from './App';
import { Wrapper } from './wrapper';


const root = document.getElementById('root');

if (root) {
    createRoot(root).render(
        <Wrapper>
            <App />
        </Wrapper>
    );
}
