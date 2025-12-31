import { Grid } from '@radix-ui/themes';

import { Containers } from './containers';
import { Projects } from './projects';


function App() {
    return (
        <Grid
            columns="repeat(3, 1fr)"
            rows="1"
            gap="3"
            width="auto"
            height="100%"
        >
            <Projects />
            <Containers />
        </Grid>
    );
}
App.displayName = 'App';

export default App;
