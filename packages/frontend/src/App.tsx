import { Box, Grid, Tabs } from '@radix-ui/themes';

import styles from './App.module.scss';
import { AccessControl } from './access-control';
import { Containers } from './containers';
import { Projects } from './projects';
import { Routing } from './routing';
import { SearchWrapper } from './search/context';
import { Users } from './users';
import { UserGroups } from './users/user-groups';


/* eslint-disable @typescript-eslint/naming-convention */
const View = {
    DEFAULT: 'default',
    ROUTING: 'routing',
    ACCESS_CONTROL: 'access-control'
};
/* eslint-enable @typescript-eslint/naming-convention */

function App() {
    return (
        <Tabs.Root
            defaultValue={View.DEFAULT}
            style={{ height: '100%', maxHeight: '100%', display: 'flex', flexDirection: 'column' }}
        >
            <Tabs.List style={{ flex: '0 0 min-content' }}>
                <Tabs.Trigger value={View.DEFAULT}>Projects, Containers, Routers</Tabs.Trigger>
                <Tabs.Trigger value={View.ROUTING}>Routing</Tabs.Trigger>
                <Tabs.Trigger value={View.ACCESS_CONTROL}>Access Control</Tabs.Trigger>
            </Tabs.List>

            <Box
                pt="3"
                style={{ flex: 1, overflow: 'hidden' }}
            >
                <Tabs.Content
                    value={View.DEFAULT}
                    style={{ height: '100%' }}
                >
                    <Grid
                        columns="repeat(4, max-content) 1fr"
                        rows="min-content 1fr"
                        width="auto"
                        height="100%"
                        gap="3"
                    >
                        <SearchWrapper classNames={{ fieldWrapper: styles.fieldWrapper }}>
                            <Projects />
                            <Containers />
                            <Users />
                            <UserGroups />
                            {/* <ACL /> */}
                        </SearchWrapper>
                    </Grid>
                </Tabs.Content>

                <Tabs.Content
                    value={View.ROUTING}
                    style={{ height: '100%', maxHeight: '100%' }}
                >
                    <Routing />
                </Tabs.Content>

                <Tabs.Content
                    value={View.ACCESS_CONTROL}
                    style={{ height: '100%', maxHeight: '100%' }}
                >
                    <AccessControl />
                </Tabs.Content>
            </Box>
        </Tabs.Root>
    );
}
App.displayName = 'App';

export default App;
