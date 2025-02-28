import { CircleProgress, Notice } from '@linode/ui';
import Grid from '@mui/material/Unstable_Grid2';
import { createLazyRoute } from '@tanstack/react-router';
import * as React from 'react';
import { useHistory } from 'react-router-dom';

import { DocumentTitleSegment } from 'src/components/DocumentTitle';
import { LandingHeader } from 'src/components/LandingHeader';
import { listToItemsByID } from 'src/queries/base';
import { useAllImagesQuery } from 'src/queries/images';

import StackScriptPanel from './StackScriptPanel/StackScriptPanel';

import type { Image } from '@linode/api-v4';

export const StackScriptsLanding = () => {
  const history = useHistory<{
    successMessage?: string;
  }>();

  const { data: _imagesData, isLoading: _loading } = useAllImagesQuery(
    {},
    { is_public: true }
  );

  const imagesData: Record<string, Image> = listToItemsByID(_imagesData ?? []);

  const goToCreateStackScript = () => {
    history.push('/stackscripts/create');
  };

  return (
    <React.Fragment>
      <DocumentTitleSegment
        segment={
          history.location.pathname === '/stackscripts/community'
            ? 'Community StackScripts'
            : 'Account StackScripts'
        }
      />
      {!!history.location.state && !!history.location.state.successMessage ? (
        <Notice
          text={history.location.state.successMessage}
          variant="success"
        />
      ) : null}
      <LandingHeader
        docsLink="https://techdocs.akamai.com/cloud-computing/docs/stackscripts"
        entity="StackScript"
        onButtonClick={goToCreateStackScript}
        removeCrumbX={1}
        title="StackScripts"
      />
      <Grid className="m0" container>
        {_loading ? (
          <CircleProgress />
        ) : (
          <Grid className="p0" xs={12}>
            <StackScriptPanel
              history={history}
              location={history.location}
              publicImages={imagesData}
              queryString={history.location.search}
            />
          </Grid>
        )}
      </Grid>
    </React.Fragment>
  );
};

export default StackScriptsLanding;

export const stackScriptsLandingLazyRoute = createLazyRoute('/stackscripts')({
  component: StackScriptsLanding,
});
