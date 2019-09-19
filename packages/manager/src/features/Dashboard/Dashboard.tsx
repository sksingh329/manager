import { Notification } from 'linode-js-sdk/lib/account';
import { Linode } from 'linode-js-sdk/lib/linodes';
import { path, pathOr } from 'ramda';
import * as React from 'react';
import { connect, MapDispatchToProps } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';
import { compose } from 'recompose';
import AbuseTicketBanner from 'src/components/AbuseTicketBanner';
import {
  createStyles,
  Theme,
  withStyles,
  WithStyles,
  WithTheme
} from 'src/components/core/styles';
import Typography from 'src/components/core/Typography';
import { DocumentTitleSegment } from 'src/components/DocumentTitle';
import Grid from 'src/components/Grid';
import TagImportDrawer from 'src/features/TagImport';
import useFlags from 'src/hooks/useFlags';
import { handleOpen } from 'src/store/backupDrawer';
import getEntitiesWithGroupsToImport, {
  emptyGroupedEntities,
  GroupedEntitiesForImport
} from 'src/store/selectors/getEntitiesWithGroupsToImport';
import { openGroupDrawer } from 'src/store/tagImportDrawer';
import { MapState } from 'src/store/types';
import shouldDisplayGroupImport from 'src/utilities/shouldDisplayGroupImportCTA';
import { storage } from 'src/utilities/storage';
import BackupsDashboardCard from './BackupsDashboardCard';
import BlogDashboardCard from './BlogDashboardCard';
import DomainsDashboardCard from './DomainsDashboardCard';
import ImportGroupsCard from './GroupImportCard';
import LinodesDashboardCard from './LinodesDashboardCard';
import ManagedDashboardCard from './ManagedDashboardCard';
import NodeBalancersDashboardCard from './NodeBalancersDashboardCard';
import PromotionsBanner from './PromotionsBanner';
import TransferDashboardCard from './TransferDashboardCard';
import VolumesDashboardCard from './VolumesDashboardCard';

import MaintenanceBanner from 'src/components/MaintenanceBanner';
import TaxBanner from 'src/components/TaxBanner';

type ClassNames = 'root';

const styles = (theme: Theme) =>
  createStyles({
    root: {}
  });

interface StateProps {
  accountBackups: boolean;
  linodesWithoutBackups: Linode[];
  managed: boolean;
  backupError?: Error;
  entitiesWithGroupsToImport: GroupedEntitiesForImport;
  notifications: Notification[];
  userTimezone: string;
  userTimezoneLoading: boolean;
  userTimezoneError?: Linode.ApiFieldError[];
  someLinodesHaveScheduledMaintenance: boolean;
}

interface DispatchProps {
  actions: {
    openBackupDrawer: () => void;
    openImportDrawer: () => void;
  };
}

type CombinedProps = StateProps &
  DispatchProps &
  WithStyles<ClassNames> &
  WithTheme &
  RouteComponentProps<{}>;

export const Dashboard: React.StatelessComponent<CombinedProps> = props => {
  const {
    accountBackups,
    actions: { openBackupDrawer, openImportDrawer },
    backupError,
    linodesWithoutBackups,
    managed,
    notifications,
    entitiesWithGroupsToImport,
    location
  } = props;

  const flags = useFlags();

  return (
    <React.Fragment>
      {props.someLinodesHaveScheduledMaintenance && (
        <MaintenanceBanner
          userTimezone={props.userTimezone}
          userTimezoneError={props.userTimezoneError}
          userTimezoneLoading={props.userTimezoneLoading}
        />
      )}
      <Grid container spacing={3}>
        <AbuseTicketBanner />
        <TaxBanner location={location} marginBottom={8} />
        <DocumentTitleSegment segment="Dashboard" />
        <Grid item xs={12}>
          <Typography variant="h1" data-qa-dashboard-header>
            Dashboard
          </Typography>
        </Grid>
        <Grid item xs={12} md={7}>
          {flags.promos && (
            <PromotionsBanner
              notifications={notifications.filter(
                thisNotification => thisNotification.type === 'promotion'
              )}
            />
          )}
          {flags.managed && managed && <ManagedDashboardCard />}
          <LinodesDashboardCard />
          <VolumesDashboardCard />
          <NodeBalancersDashboardCard />
          <DomainsDashboardCard />
        </Grid>
        <Grid item xs={12} md={5}>
          <TransferDashboardCard />
          {!managed && !backupError && (
            <BackupsDashboardCard
              accountBackups={accountBackups}
              linodesWithoutBackups={linodesWithoutBackups.length}
              openBackupDrawer={openBackupDrawer}
            />
          )}
          {!storage.hideGroupImportCTA.get() &&
            shouldDisplayGroupImport(entitiesWithGroupsToImport) && (
              <ImportGroupsCard
                theme={props.theme.name}
                openImportDrawer={openImportDrawer}
                dismiss={storage.hideGroupImportCTA.set}
              />
            )}
          <BlogDashboardCard />
        </Grid>
      </Grid>
      <TagImportDrawer />
    </React.Fragment>
  );
};

const mapStateToProps: MapState<StateProps, {}> = (state, ownProps) => {
  const linodesData = state.__resources.linodes.entities;

  return {
    accountBackups: pathOr(
      false,
      ['__resources', 'accountSettings', 'data', 'backups_enabled'],
      state
    ),
    notifications: pathOr([], ['data'], state.__resources.notifications),
    userTimezone: pathOr('', ['data', 'timezone'], state.__resources.profile),
    userTimezoneLoading: state.__resources.profile.loading,
    userTimezoneError: path(['read'], state.__resources.profile.error),
    someLinodesHaveScheduledMaintenance: linodesData
      ? linodesData.some(eachLinode => !!eachLinode.maintenance)
      : false,
    linodesWithoutBackups: linodesData.filter(l => !l.backups.enabled),
    managed: pathOr(
      false,
      ['__resources', 'accountSettings', 'data', 'managed'],
      state
    ),
    backupError: pathOr(false, ['backups', 'error'], state),
    entitiesWithGroupsToImport:
      !storage.hideGroupImportCTA.get() && !storage.hasImportedGroups.get()
        ? getEntitiesWithGroupsToImport(state)
        : emptyGroupedEntities
  };
};

const mapDispatchToProps: MapDispatchToProps<DispatchProps, {}> = (
  dispatch,
  ownProps
) => {
  return {
    actions: {
      openBackupDrawer: () => dispatch(handleOpen()),
      openImportDrawer: () => dispatch(openGroupDrawer())
    }
  };
};

const connected = connect(
  mapStateToProps,
  mapDispatchToProps
);

const styled = withStyles(styles, { withTheme: true });

const enhanced = compose<CombinedProps, {}>(
  styled,
  connected
)(Dashboard);

export default enhanced;
