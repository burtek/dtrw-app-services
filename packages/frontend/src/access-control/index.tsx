import { DoubleArrowRightIcon } from '@radix-ui/react-icons';
import { Box, Button, Grid, Heading } from '@radix-ui/themes';
import { memo, useCallback, useState } from 'react';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';
import { toast } from 'react-toastify';

import { useApplyConfigMutation, useForceReloadAllTrigger, useGetActualConfigQuery, useGetExpectedConfigQuery } from './api';
import { AccessControlRules } from './rules-list';


const EXPANDED_WIDTH_PERCENT = 65;
const EXPANDED_WIDTH = `${EXPANDED_WIDTH_PERCENT}%`;
const COLLAPSED_WIDTH = `${100 - EXPANDED_WIDTH_PERCENT}%`;

const DIFF_VIEWER_STYLES = {
    diffContainer: { width: 'max-content' },
    emptyLine: { height: '.7em' }
};

const Component = () => {
    const { data: actualConfig } = useGetActualConfigQuery();
    const { data: expectedConfig } = useGetExpectedConfigQuery();

    const [applyConfig, { isLoading: isApplying }] = useApplyConfigMutation();
    const [forceReloadAll] = useForceReloadAllTrigger();

    const [expanded, setExpanded] = useState<null | 'config' | 'diff'>(null);
    const toggle = (section: NonNullable<typeof expanded>) => () => {
        setExpanded(old => (old === section ? null : section));
    };

    const handleApply = useCallback<React.MouseEventHandler>(async event => {
        event.stopPropagation();

        const result = await applyConfig();
        if (result.error || !result.data) {
            toast.error('Apply failed');
        } else {
            toast.success('Access control config applied');
        }
    }, [applyConfig]);

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
                default: '50% 50%',
                config: `${EXPANDED_WIDTH} ${COLLAPSED_WIDTH}`,
                diff: `${COLLAPSED_WIDTH} ${EXPANDED_WIDTH}`
            }[expanded ?? 'default']}
            rows="min-content min-content 1fr"
            gap="4"
            height="100%"
            maxHeight="100%"
            width="100%"
            style={{ transition: 'grid-template-columns 0.3s ease-in-out' }}
        >
            <Box style={{ gridColumn: '1 / span 2' }}>
                <Button
                    onClick={forceReloadAll}
                    size="1"
                >
                    Force reload data
                </Button>
            </Box>

            {renderHeading('Access Control Configuration', 'config')}

            {renderHeading(
                'Authelia Config Diff',
                'diff',
                <Button
                    size="1"
                    style={{ position: 'absolute', top: 0, left: 0, transform: 'translateX(-50%) translateX(-8px)' }}
                    loading={isApplying}
                    onClick={handleApply}
                >
                    <DoubleArrowRightIcon />
                    {' '}
                    Apply Config
                    <DoubleArrowRightIcon />
                </Button>
            )}

            <Box style={{ overflowY: 'auto' }}>
                <AccessControlRules />
            </Box>

            <Box style={{ overflowY: 'auto', overflowX: 'auto' }}>
                <ReactDiffViewer
                    oldValue={actualConfig}
                    newValue={expectedConfig}
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
Component.displayName = 'AccessControl';

export const AccessControl = memo(Component);
