import { DoubleArrowRightIcon } from '@radix-ui/react-icons';
import { Box, Button, Grid, Heading } from '@radix-ui/themes';
import { memo, useCallback, useState } from 'react';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';
import { toast } from 'react-toastify';

import { useGetCaddyfileQuery, useGetAppConfigConvertedQuery, useGetCaddyAPIQuery, useGetCaddyfileAdaptedQuery, useWriteCaddyfileMutation, useApplyCaddyfileMutation, useForceReloadAllTrigger } from './api';
import { RoutingConfig } from './routing-entries';


const EXPANDED_WIDTH_PERCENT = 70;
const EXPANDED_WIDTH = `${EXPANDED_WIDTH_PERCENT}%`;
const COLLAPSED_WIDTH = `${(100 - EXPANDED_WIDTH_PERCENT) / 2}%`;

const DIFF_VIEWER_STYLES = {
    diffContainer: { width: 'max-content' },
    emptyLine: { height: '.7em' }
};

const Component = () => {
    const { data: caddyfile } = useGetCaddyfileQuery();
    const { data: expectedCaddyfile } = useGetAppConfigConvertedQuery();

    const { data: caddyAPI } = useGetCaddyAPIQuery();
    const { data: expectedCaddyAPI } = useGetCaddyfileAdaptedQuery();

    const [writeCaddyfile, { isLoading: isWritingCaddyfile }] = useWriteCaddyfileMutation();
    const [applyCaddyfile, { isLoading: isApplyingCaddyfile }] = useApplyCaddyfileMutation();

    const [forceReloadAll] = useForceReloadAllTrigger();

    const [expanded, setExpanded] = useState<null | 'config' | 'caddyfile' | 'api'>(null);
    const toggle = (section: NonNullable<typeof expanded>) => () => {
        setExpanded(old => (old === section ? null : section));
    };

    const renderProgressButton = (text: string, mutation: () => ReturnType<typeof writeCaddyfile>, isLoding: boolean, disabled: boolean) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const handleClick = useCallback<React.MouseEventHandler>(async event => {
            event.stopPropagation();

            const result = await mutation();
            if (result.error || !result.data) {
                toast.error(`Action failed: ${text}`);
            } else {
                toast.success(`Action successful: ${text}`);
            }
        }, [mutation, text]);

        return (
            <Button
                size="1"
                style={{ position: 'absolute', top: 0, left: 0, transform: 'translateX(-50%) translateX(-8px)' }}
                disabled={disabled}
                loading={isLoding}
                onClick={handleClick}
            >
                <DoubleArrowRightIcon />
                {' '}
                {text}
                <DoubleArrowRightIcon />
            </Button>
        );
    };

    const renderHeading = (text: string, section: NonNullable<typeof expanded>, prependNode?: React.ReactElement) => (
        <Heading
            as="h2"
            size="2"
            style={{ justifySelf: 'stretch', textAlign: 'center', cursor: expanded === section ? 'zoom-out' : 'zoom-in', position: 'relative' }}
            onClick={toggle(section)}
        >
            {prependNode}
            {text}
        </Heading>
    );

    return (
        <Grid
            columns={{
                default: '33% 33% 33%',
                config: `${EXPANDED_WIDTH} ${COLLAPSED_WIDTH} ${COLLAPSED_WIDTH}`,
                caddyfile: `${COLLAPSED_WIDTH} ${EXPANDED_WIDTH} ${COLLAPSED_WIDTH}`,
                api: `${COLLAPSED_WIDTH} ${COLLAPSED_WIDTH} ${EXPANDED_WIDTH}`
            }[expanded ?? 'default']}
            rows="min-content min-content 1fr"
            gap="4"
            height="100%"
            maxHeight="100%"
            width="100%"
            style={{ transition: 'grid-template-columns 0.3s ease-in-out' }}
        >
            <Box style={{ gridColumn: '1 / span 3' }}>
                <Button
                    onClick={forceReloadAll}
                    size="1"
                >
                    Force reload data
                </Button>
            </Box>
            {renderHeading('Routing Configuration', 'config')}
            {renderHeading(
                'Caddyfile',
                'caddyfile',
                renderProgressButton('Write Caddyfile', writeCaddyfile, isWritingCaddyfile, isApplyingCaddyfile)
            )}
            {renderHeading(
                'Caddy API',
                'api',
                renderProgressButton('Apply Caddyfile', applyCaddyfile, isApplyingCaddyfile, isWritingCaddyfile)
            )}

            <Box style={{ overflowY: 'auto' }}>
                <RoutingConfig />
            </Box>
            <Box style={{ overflowY: 'auto', overflowX: 'auto' }}>
                <ReactDiffViewer
                    oldValue={caddyfile?.replaceAll(/\t/g, '  ')}
                    newValue={expectedCaddyfile?.replaceAll(/\t/g, '  ')}
                    splitView={false}
                    compareMethod={DiffMethod.WORDS}
                    showDiffOnly={false}
                    hideLineNumbers
                    styles={DIFF_VIEWER_STYLES}
                />
            </Box>
            <Box style={{ overflowY: 'auto', overflowX: 'auto' }}>
                <ReactDiffViewer
                    oldValue={caddyAPI}
                    newValue={expectedCaddyAPI}
                    splitView={false}
                    compareMethod={DiffMethod.JSON}
                    showDiffOnly={false}
                    hideLineNumbers
                    styles={DIFF_VIEWER_STYLES}
                />
            </Box>
        </Grid>
    );
};
Component.displayName = 'Routing';

export const Routing = memo(Component);
