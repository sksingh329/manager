import { applyMiddleware, combineReducers, compose, createStore } from 'redux';
import thunk from 'redux-thunk';
import accountManagement, {
  defaultState as defaultAccountManagementState,
  State as AccountManagementState,
} from 'src/store/accountManagement/accountManagement.reducer';
import { State as AuthState } from 'src/store/authentication';
import authentication, {
  defaultState as authenticationDefaultState,
} from 'src/store/authentication/authentication.reducer';
import backups, {
  defaultState as backupsDefaultState,
  State as BackupDrawerState,
} from 'src/store/backupDrawer';
import bucketDrawer, {
  defaultState as bucketDrawerDefaultState,
  State as BucketDrawerState,
} from 'src/store/bucketDrawer/bucketDrawer.reducer';
import documentation, {
  defaultState as documentationDefaultState,
  State as DocumentationState,
} from 'src/store/documentation';
import events, {
  defaultState as eventsDefaultState,
  State as EventsState,
} from 'src/store/events/event.reducer';
import firewallDevices, {
  defaultState as defaultFirewallDevicesState,
  State as FirewallDevicesState,
} from 'src/store/firewalls/devices.reducer';
import firewalls, {
  defaultState as defaultFirewallState,
  State as FirewallState,
} from 'src/store/firewalls/firewalls.reducer';
import globalErrors, {
  defaultState as defaultGlobalErrorState,
  State as GlobalErrorState,
} from 'src/store/globalErrors';
import linodeCreateReducer, {
  defaultState as linodeCreateDefaultState,
  State as LinodeCreateState,
} from 'src/store/linodeCreate/linodeCreate.reducer';
import linodeConfigEvents from 'src/store/linodes/config/config.events';
import linodeConfigs, {
  defaultState as defaultLinodeConfigsState,
  State as LinodeConfigsState,
} from 'src/store/linodes/config/config.reducer';
import linodeDisks, {
  defaultState as defaultLinodeDisksState,
  State as LinodeDisksState,
} from 'src/store/linodes/disk/disk.reducer';
import linodeEvents from 'src/store/linodes/linodes.events';
import linodes, {
  defaultState as defaultLinodesState,
  State as LinodesState,
} from 'src/store/linodes/linodes.reducer';
import types, {
  defaultState as defaultTypesState,
  State as TypesState,
} from 'src/store/linodeType/linodeType.reducer';
import longviewEvents from 'src/store/longview/longview.events';
import longview, {
  defaultState as defaultLongviewState,
  State as LongviewState,
} from 'src/store/longview/longview.reducer';
import longviewStats, {
  defaultState as defaultLongviewStatsState,
  State as LongviewStatsState,
} from 'src/store/longviewStats/longviewStats.reducer';
import nodeBalancers, {
  defaultState as defaultNodeBalancerState,
  State as NodeBalancersState,
} from 'src/store/nodeBalancer/nodeBalancer.reducer';
import nodeBalancerConfigs, {
  defaultState as defaultNodeBalancerConfigState,
  State as NodeBalancerConfigsState,
} from 'src/store/nodeBalancerConfig/nodeBalancerConfig.reducer';
import stackScriptDialog, {
  defaultState as stackScriptDialogDefaultState,
  State as StackScriptDialogState,
} from 'src/store/stackScriptDialog';
import tagImportDrawer, {
  defaultState as tagDrawerDefaultState,
  State as TagImportDrawerState,
} from 'src/store/tagImportDrawer';
import volumeDrawer, {
  defaultState as volumeDrawerDefaultState,
  State as VolumeDrawerState,
} from 'src/store/volumeForm';
import featureFlagsLoad, {
  defaultState as featureFlagsLoadState,
  State as FeatureFlagsLoadState,
} from './featureFlagsLoad/featureFlagsLoad.reducer';
import initialLoad, {
  defaultState as initialLoadState,
  State as InitialLoadState,
} from './initialLoad/initialLoad.reducer';
import diskEvents from './linodes/disk/disk.events';
import combineEventsMiddleware from './middleware/combineEventsMiddleware';
import mockFeatureFlags, {
  defaultMockFeatureFlagState,
  MockFeatureFlagState,
} from './mockFeatureFlags';
import nodeBalancerEvents from './nodeBalancer/nodeBalancer.events';
import nodeBalancerConfigEvents from './nodeBalancerConfig/nodeBalancerConfig.events';
import notifications, {
  defaultState as notificationsDefaultState,
  State as NotificationsState,
} from './notification/notification.reducer';
import pendingUpload, {
  defaultState as pendingUploadState,
  State as PendingUploadState,
} from './pendingUpload';
import { initReselectDevtools } from './selectors';

const reduxDevTools = (window as any).__REDUX_DEVTOOLS_EXTENSION__;
initReselectDevtools();

/**
 * Default State
 */
const __resourcesDefaultState = {
  accountManagement: defaultAccountManagementState,
  linodes: defaultLinodesState,
  linodeConfigs: defaultLinodeConfigsState,
  linodeDisks: defaultLinodeDisksState,
  nodeBalancerConfigs: defaultNodeBalancerConfigState,
  nodeBalancers: defaultNodeBalancerState,
  notifications: notificationsDefaultState,
  types: defaultTypesState,
};

export interface ResourcesState {
  accountManagement: AccountManagementState;
  linodes: LinodesState;
  linodeConfigs: LinodeConfigsState;
  linodeDisks: LinodeDisksState;
  nodeBalancerConfigs: NodeBalancerConfigsState;
  nodeBalancers: NodeBalancersState;
  notifications: NotificationsState;
  types: TypesState;
}

export interface ApplicationState {
  __resources: ResourcesState;
  authentication: AuthState;
  backups: BackupDrawerState;
  documentation: DocumentationState;
  events: EventsState;
  stackScriptDialog: StackScriptDialogState;
  tagImportDrawer: TagImportDrawerState;
  volumeDrawer: VolumeDrawerState;
  bucketDrawer: BucketDrawerState;
  createLinode: LinodeCreateState;
  pendingUpload: PendingUploadState;
  initialLoad: InitialLoadState;
  featureFlagsLoad: FeatureFlagsLoadState;
  firewalls: FirewallState;
  firewallDevices: FirewallDevicesState;
  globalErrors: GlobalErrorState;
  longviewClients: LongviewState;
  longviewStats: LongviewStatsState;
  mockFeatureFlags: MockFeatureFlagState;
}

export const defaultState: ApplicationState = {
  __resources: __resourcesDefaultState,
  authentication: authenticationDefaultState,
  backups: backupsDefaultState,
  documentation: documentationDefaultState,
  events: eventsDefaultState,
  stackScriptDialog: stackScriptDialogDefaultState,
  tagImportDrawer: tagDrawerDefaultState,
  volumeDrawer: volumeDrawerDefaultState,
  bucketDrawer: bucketDrawerDefaultState,
  createLinode: linodeCreateDefaultState,
  pendingUpload: pendingUploadState,
  initialLoad: initialLoadState,
  featureFlagsLoad: featureFlagsLoadState,
  firewalls: defaultFirewallState,
  firewallDevices: defaultFirewallDevicesState,
  globalErrors: defaultGlobalErrorState,
  longviewClients: defaultLongviewState,
  longviewStats: defaultLongviewStatsState,
  mockFeatureFlags: defaultMockFeatureFlagState,
};

/**
 * Reducers
 */
const __resources = combineReducers({
  accountManagement,
  linodes,
  linodeConfigs,
  linodeDisks,
  nodeBalancers,
  nodeBalancerConfigs,
  notifications,
  types,
});

const reducers = combineReducers<ApplicationState>({
  __resources,
  authentication,
  backups,
  documentation,
  stackScriptDialog,
  tagImportDrawer,
  volumeDrawer,
  bucketDrawer,
  events,
  createLinode: linodeCreateReducer,
  pendingUpload,
  initialLoad,
  featureFlagsLoad,
  firewalls,
  firewallDevices,
  globalErrors,
  longviewClients: longview,
  longviewStats,
  mockFeatureFlags,
});

const enhancers = compose(
  applyMiddleware(
    thunk,
    combineEventsMiddleware(
      linodeEvents,
      longviewEvents,
      nodeBalancerEvents,
      nodeBalancerConfigEvents,
      diskEvents,
      linodeConfigEvents
    )
  ),
  reduxDevTools ? reduxDevTools() : (f: any) => f
) as any;

export default createStore(reducers, defaultState, enhancers);
