import { Flex } from '@radix-ui/themes';

import styles from './App.module.scss';
import { Containers } from './containers';
import { Projects } from './projects';


function App() {
    return (
        <Flex
            direction="row"
            height="100%"
            width="auto"
            gap="3"
            className={styles.app}
        >
            <Projects />
            <Containers />
            {/* <Users /> */}
            {/* <ACL /> */}
            {/* <Routing /> */}
        </Flex>
    );
}
App.displayName = 'App';

export default App;
