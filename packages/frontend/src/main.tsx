import '@radix-ui/themes/styles.css';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { createRoot } from 'react-dom/client';

import './main.scss';
import App from './App';
import { Wrapper } from './wrapper';


const root = document.getElementById('root');

if (root) {
    createRoot(root).render(
        <Wrapper>
            <DndProvider backend={HTML5Backend}>
                <App />
            </DndProvider>
        </Wrapper>
    );
}
