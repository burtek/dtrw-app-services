import { Grid } from '@radix-ui/themes';

import styles from './App.module.scss';
import { Containers } from './containers';
import { Projects } from './projects';
import { SearchWrapper } from './search/context';
import { Users } from './users';


function App() {
    return (
        <Grid
            columns="repeat(3, max-content)"
            rows="min-content 1fr"
            width="auto"
            height="100%"
            gap="3"
        >
            <SearchWrapper classNames={{ fieldWrapper: styles.fieldWrapper }}>
                <Projects />
                <Containers />
                <Users />
                {/* <ACL /> */}
                {/* <Routing /> */}
            </SearchWrapper>
        </Grid>
    );
}
App.displayName = 'App';

export default App;
