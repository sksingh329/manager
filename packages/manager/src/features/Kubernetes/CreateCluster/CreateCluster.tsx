import { Autocomplete, Box, Notice, Paper, Stack, TextField } from '@linode/ui';
import { Divider } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { createLazyRoute } from '@tanstack/react-router';
import { pick, remove, update } from 'ramda';
import * as React from 'react';
import { useHistory } from 'react-router-dom';

import { DocsLink } from 'src/components/DocsLink/DocsLink';
import { DocumentTitleSegment } from 'src/components/DocumentTitle';
import { ErrorMessage } from 'src/components/ErrorMessage';
import { ErrorState } from 'src/components/ErrorState/ErrorState';
import { LandingHeader } from 'src/components/LandingHeader';
import { RegionSelect } from 'src/components/RegionSelect/RegionSelect';
import { RegionHelperText } from 'src/components/SelectRegionPanel/RegionHelperText';
import {
  getKubeControlPlaneACL,
  getKubeHighAvailability,
  getLatestVersion,
  useAPLAvailability,
  useIsLkeEnterpriseEnabled,
  useLkeStandardOrEnterpriseVersions,
} from 'src/features/Kubernetes/kubeUtils';
import { useAccount } from 'src/queries/account/account';
import {
  reportAgreementSigningError,
  useMutateAccountAgreements,
} from 'src/queries/account/agreements';
import {
  useCreateKubernetesClusterBetaMutation,
  useCreateKubernetesClusterMutation,
  useKubernetesTypesQuery,
} from 'src/queries/kubernetes';
import { useRegionsQuery } from 'src/queries/regions/regions';
import { useAllTypes } from 'src/queries/types';
import { getAPIErrorOrDefault, getErrorMap } from 'src/utilities/errorUtils';
import { extendType } from 'src/utilities/extendType';
import { filterCurrentTypes } from 'src/utilities/filterCurrentLinodeTypes';
import { stringToExtendedIP } from 'src/utilities/ipUtils';
import { plansNoticesUtils } from 'src/utilities/planNotices';
import { UNKNOWN_PRICE } from 'src/utilities/pricing/constants';
import { DOCS_LINK_LABEL_DC_PRICING } from 'src/utilities/pricing/constants';
import { getDCSpecificPriceByType } from 'src/utilities/pricing/dynamicPricing';
import { scrollErrorIntoViewV2 } from 'src/utilities/scrollErrorIntoViewV2';

import KubeCheckoutBar from '../KubeCheckoutBar';
import { ApplicationPlatform } from './ApplicationPlatform';
import { ClusterTypePanel } from './ClusterTypePanel';
import { ControlPlaneACLPane } from './ControlPlaneACLPane';
import {
  StyledDocsLinkContainer,
  StyledFieldWithDocsStack,
  useStyles,
} from './CreateCluster.styles';
import { HAControlPlane } from './HAControlPlane';
import { NodePoolPanel } from './NodePoolPanel';

import type {
  CreateKubeClusterPayload,
  CreateNodePoolData,
  KubeNodePoolResponse,
  KubernetesTier,
} from '@linode/api-v4/lib/kubernetes';
import type { Region } from '@linode/api-v4/lib/regions';
import type { APIError } from '@linode/api-v4/lib/types';
import type { ExtendedIP } from 'src/utilities/ipUtils';

export const CreateCluster = () => {
  const { classes } = useStyles();
  const [selectedRegion, setSelectedRegion] = React.useState<
    Region | undefined
  >();
  const [nodePools, setNodePools] = React.useState<KubeNodePoolResponse[]>([]);
  const [label, setLabel] = React.useState<string | undefined>();
  const [version, setVersion] = React.useState<string | undefined>();
  const [errors, setErrors] = React.useState<APIError[] | undefined>();
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [hasAgreed, setAgreed] = React.useState<boolean>(false);
  const formContainerRef = React.useRef<HTMLDivElement>(null);
  const { mutateAsync: updateAccountAgreements } = useMutateAccountAgreements();
  const [highAvailability, setHighAvailability] = React.useState<boolean>();
  const [controlPlaneACL, setControlPlaneACL] = React.useState<boolean>(false);
  const [apl_enabled, setApl_enabled] = React.useState<boolean>(false);

  const { data, error: regionsError } = useRegionsQuery();
  const regionsData = data ?? [];
  const history = useHistory();
  const { data: account } = useAccount();
  const { showAPL } = useAPLAvailability();
  const { showHighAvailability } = getKubeHighAvailability(account);
  const { showControlPlaneACL } = getKubeControlPlaneACL(account);
  const [ipV4Addr, setIPv4Addr] = React.useState<ExtendedIP[]>([
    stringToExtendedIP(''),
  ]);
  const [ipV6Addr, setIPv6Addr] = React.useState<ExtendedIP[]>([
    stringToExtendedIP(''),
  ]);
  const [selectedTier, setSelectedTier] = React.useState<KubernetesTier>(
    'standard'
  );

  const {
    data: kubernetesHighAvailabilityTypesData,
    isError: isErrorKubernetesTypes,
    isLoading: isLoadingKubernetesTypes,
  } = useKubernetesTypesQuery(selectedTier === 'enterprise');

  const handleClusterTypeSelection = (tier: KubernetesTier) => {
    setSelectedTier(tier);

    // HA is enabled by default for enterprise clusters
    if (tier === 'enterprise') {
      setHighAvailability(true);

      // When changing the tier to enterprise, we want to check if the pre-selected region has the capability
      if (!selectedRegion?.capabilities.includes('Kubernetes Enterprise')) {
        setSelectedRegion(undefined);
      }
    } else {
      setHighAvailability(undefined);
    }
  };

  const lkeHAType = kubernetesHighAvailabilityTypesData?.find(
    (type) => type.id === 'lke-ha'
  );

  const lkeEnterpriseType = kubernetesHighAvailabilityTypesData?.find(
    (type) => type.id === 'lke-e'
  );

  const {
    data: allTypes,
    error: typesError,
    isLoading: typesLoading,
  } = useAllTypes();

  // Only want to use current types here.
  const typesData = filterCurrentTypes(allTypes?.map(extendType));

  const {
    mutateAsync: createKubernetesCluster,
  } = useCreateKubernetesClusterMutation();

  const {
    mutateAsync: createKubernetesClusterBeta,
  } = useCreateKubernetesClusterBetaMutation();

  const {
    isLkeEnterpriseLAFeatureEnabled,
    isLkeEnterpriseLAFlagEnabled,
  } = useIsLkeEnterpriseEnabled();

  const {
    isLoadingVersions,
    versions: versionData,
    versionsError,
  } = useLkeStandardOrEnterpriseVersions(selectedTier);

  const versions = (versionData ?? []).map((thisVersion) => ({
    label: thisVersion.id,
    value: thisVersion.id,
  }));

  React.useEffect(() => {
    if (versions.length > 0) {
      setVersion(getLatestVersion(versions).value);
    }
  }, [versionData]);

  const createCluster = () => {
    if (ipV4Addr.some((ip) => ip.error) || ipV6Addr.some((ip) => ip.error)) {
      scrollErrorIntoViewV2(formContainerRef);
      return;
    }

    const { push } = history;
    setErrors(undefined);
    setSubmitting(true);

    const node_pools = nodePools.map(
      pick(['type', 'count'])
    ) as CreateNodePoolData[];

    const _ipv4 = ipV4Addr
      .map((ip) => {
        return ip.address;
      })
      .filter((ip) => ip !== '');

    const _ipv6 = ipV6Addr
      .map((ip) => {
        return ip.address;
      })
      .filter((ip) => ip !== '');

    const addressIPv4Payload = {
      ...(_ipv4.length > 0 && { ipv4: _ipv4 }),
    };

    const addressIPv6Payload = {
      ...(_ipv6.length > 0 && { ipv6: _ipv6 }),
    };

    let payload: CreateKubeClusterPayload = {
      control_plane: {
        acl: {
          enabled: controlPlaneACL,
          'revision-id': '',
          ...(controlPlaneACL && // only send the IPs if we are enabling IPACL
            (_ipv4.length > 0 || _ipv6.length > 0) && {
              addresses: {
                ...addressIPv4Payload,
                ...addressIPv6Payload,
              },
            }),
        },
        high_availability: highAvailability ?? false,
      },
      k8s_version: version,
      label,
      node_pools,
      region: selectedRegion?.id,
    };

    if (showAPL) {
      payload = { ...payload, apl_enabled };
    }

    if (isLkeEnterpriseLAFeatureEnabled) {
      payload = { ...payload, tier: selectedTier };
    }

    const createClusterFn =
      showAPL || isLkeEnterpriseLAFeatureEnabled
        ? createKubernetesClusterBeta
        : createKubernetesCluster;

    createClusterFn(payload)
      .then((cluster) => {
        push(`/kubernetes/clusters/${cluster.id}`);
        if (hasAgreed) {
          updateAccountAgreements({
            eu_model: true,
            privacy_policy: true,
          }).catch(reportAgreementSigningError);
        }
      })
      .catch((err) => {
        setErrors(getAPIErrorOrDefault(err, 'Error creating your cluster'));
        setSubmitting(false);
        scrollErrorIntoViewV2(formContainerRef);
      });
  };

  const toggleHasAgreed = () => setAgreed((prevHasAgreed) => !prevHasAgreed);

  const addPool = (pool: KubeNodePoolResponse) => {
    setNodePools([...nodePools, pool]);
  };

  const updatePool = (poolIdx: number, updatedPool: KubeNodePoolResponse) => {
    const updatedPoolWithPrice = {
      ...updatedPool,
    };
    setNodePools(update(poolIdx, updatedPoolWithPrice, nodePools));
  };

  const removePool = (poolIdx: number) => {
    const updatedPools = remove(poolIdx, 1, nodePools);
    setNodePools(updatedPools);
  };

  const updateLabel = (newLabel: string) => {
    // If the new label is an empty string, use undefined. This allows it to pass Yup validation.
    setLabel(newLabel ? newLabel : undefined);
  };

  const highAvailabilityPrice = getDCSpecificPriceByType({
    regionId: selectedRegion?.id,
    type: lkeHAType,
  });

  const errorMap = getErrorMap(
    [
      'region',
      'node_pools',
      'label',
      'k8s_version',
      'versionLoad',
      'control_plane',
    ],
    errors
  );

  const generalError = errorMap.none;

  const {
    hasSelectedRegion,
    isPlanPanelDisabled,
    isSelectedRegionEligibleForPlan,
  } = plansNoticesUtils({
    regionsData,
    selectedRegionID: selectedRegion?.id,
  });

  if (typesError || regionsError || versionsError) {
    // This information is necessary to create a Cluster. Otherwise, show an error state.
    return <ErrorState errorText="An unexpected error occurred." />;
  }

  return (
    <Grid className={classes.root} container ref={formContainerRef}>
      <DocumentTitleSegment segment="Create a Kubernetes Cluster" />
      <LandingHeader
        docsLabel="Docs"
        docsLink="https://techdocs.akamai.com/cloud-computing/docs/getting-started-with-lke-linode-kubernetes-engine"
        title="Create Cluster"
      />
      <Grid className={`mlMain py0`}>
        {generalError && (
          <Notice variant="error">
            <ErrorMessage
              entity={{ type: 'lkecluster_id' }}
              formPayloadValues={{ node_pools: nodePools }}
              message={generalError}
            />
          </Notice>
        )}
        <Paper data-qa-label-header>
          <TextField
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateLabel(e.target.value)
            }
            data-qa-label-input
            errorText={errorMap.label}
            label="Cluster Label"
            value={label || ''}
          />
          {isLkeEnterpriseLAFlagEnabled && (
            <>
              <Divider sx={{ marginBottom: 2, marginTop: 4 }} />
              <ClusterTypePanel
                handleClusterTypeSelection={handleClusterTypeSelection}
                selectedTier={selectedTier}
              />
            </>
          )}
          <Divider sx={{ marginTop: 4 }} />
          <StyledFieldWithDocsStack>
            <Stack>
              <RegionSelect
                currentCapability={
                  isLkeEnterpriseLAFeatureEnabled &&
                  selectedTier === 'enterprise'
                    ? 'Kubernetes Enterprise'
                    : 'Kubernetes'
                }
                textFieldProps={{
                  helperText: <RegionHelperText mb={2} />,
                  helperTextPosition: 'top',
                }}
                tooltipText={
                  isLkeEnterpriseLAFeatureEnabled &&
                  selectedTier === 'enterprise'
                    ? 'Only regions that support Kubernetes Enterprise are listed.'
                    : undefined
                }
                disableClearable
                errorText={errorMap.region}
                onChange={(e, region) => setSelectedRegion(region)}
                regions={regionsData}
                value={selectedRegion?.id}
              />
            </Stack>
            <StyledDocsLinkContainer
              sx={(theme) => ({ marginTop: theme.spacing(2) })}
            >
              <DocsLink
                href="https://www.linode.com/pricing"
                label={DOCS_LINK_LABEL_DC_PRICING}
              />
            </StyledDocsLinkContainer>
          </StyledFieldWithDocsStack>
          <Divider sx={{ marginTop: 4 }} />
          <Autocomplete
            onChange={(_, selected) => {
              setVersion(selected?.value);
            }}
            disableClearable={!!version}
            errorText={errorMap.k8s_version}
            label="Kubernetes Version"
            loading={isLoadingVersions}
            options={versions}
            placeholder={' '}
            value={versions.find((v) => v.value === version) ?? null}
          />
          {showAPL && (
            <>
              <Divider sx={{ marginTop: 4 }} />
              <StyledFieldWithDocsStack>
                <Stack>
                  <ApplicationPlatform
                    setAPL={setApl_enabled}
                    setHighAvailability={setHighAvailability}
                  />
                </Stack>
              </StyledFieldWithDocsStack>
            </>
          )}
          <Divider sx={{ marginTop: showAPL ? 1 : 4 }} />
          {showHighAvailability && selectedTier !== 'enterprise' && (
            <Box data-testid="ha-control-plane">
              <HAControlPlane
                highAvailabilityPrice={
                  isErrorKubernetesTypes || !highAvailabilityPrice
                    ? UNKNOWN_PRICE
                    : highAvailabilityPrice
                }
                isAPLEnabled={apl_enabled}
                isErrorKubernetesTypes={isErrorKubernetesTypes}
                isLoadingKubernetesTypes={isLoadingKubernetesTypes}
                selectedRegionId={selectedRegion?.id}
                setHighAvailability={setHighAvailability}
              />
            </Box>
          )}
          {showControlPlaneACL && (
            <>
              {selectedTier !== 'enterprise' && <Divider />}
              <ControlPlaneACLPane
                handleIPv4Change={(newIpV4Addr: ExtendedIP[]) => {
                  setIPv4Addr(newIpV4Addr);
                }}
                handleIPv6Change={(newIpV6Addr: ExtendedIP[]) => {
                  setIPv6Addr(newIpV6Addr);
                }}
                enableControlPlaneACL={controlPlaneACL}
                errorText={errorMap.control_plane}
                ipV4Addr={ipV4Addr}
                ipV6Addr={ipV6Addr}
                setControlPlaneACL={setControlPlaneACL}
              />
            </>
          )}
          <Divider sx={{ marginBottom: 4 }} />
          <NodePoolPanel
            typesError={
              typesError
                ? getAPIErrorOrDefault(
                    typesError,
                    'Error loading Linode type information.'
                  )[0].reason
                : undefined
            }
            addNodePool={(pool: KubeNodePoolResponse) => addPool(pool)}
            apiError={errorMap.node_pools}
            hasSelectedRegion={hasSelectedRegion}
            isAPLEnabled={apl_enabled}
            isPlanPanelDisabled={isPlanPanelDisabled}
            isSelectedRegionEligibleForPlan={isSelectedRegionEligibleForPlan}
            regionsData={regionsData}
            selectedRegionId={selectedRegion?.id}
            types={typesData || []}
            typesLoading={typesLoading}
          />
        </Paper>
      </Grid>
      <Grid
        className={`mlSidebar ${classes.sidebar}`}
        data-testid="kube-checkout-bar"
      >
        <KubeCheckoutBar
          highAvailabilityPrice={
            isErrorKubernetesTypes || !highAvailabilityPrice
              ? UNKNOWN_PRICE
              : highAvailabilityPrice
          }
          updateFor={[
            hasAgreed,
            highAvailability,
            selectedRegion?.id,
            nodePools,
            submitting,
            typesData,
            updatePool,
            removePool,
            createCluster,
            classes,
          ]}
          createCluster={createCluster}
          enterprisePrice={lkeEnterpriseType?.price.monthly ?? undefined}
          hasAgreed={hasAgreed}
          highAvailability={highAvailability}
          pools={nodePools}
          region={selectedRegion?.id}
          regionsData={regionsData}
          removePool={removePool}
          showHighAvailability={showHighAvailability}
          submitting={submitting}
          toggleHasAgreed={toggleHasAgreed}
          updatePool={updatePool}
        />
      </Grid>
    </Grid>
  );
};

export const createClusterLazyRoute = createLazyRoute('/kubernetes/create')({
  component: CreateCluster,
});
