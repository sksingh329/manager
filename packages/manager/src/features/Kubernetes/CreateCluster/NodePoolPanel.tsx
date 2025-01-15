import { CircleProgress } from '@linode/ui';
import Grid from '@mui/material/Unstable_Grid2';
import * as React from 'react';

import { useIsDiskEncryptionFeatureEnabled } from 'src/components/Encryption/utils';
import { ErrorState } from 'src/components/ErrorState/ErrorState';
import { useIsAcceleratedPlansEnabled } from 'src/features/components/PlansPanel/utils';
import { useRegionsQuery } from 'src/queries/regions/regions';
import { doesRegionSupportFeature } from 'src/utilities/doesRegionSupportFeature';
import { extendType } from 'src/utilities/extendType';

import { ADD_NODE_POOLS_DESCRIPTION } from '../ClusterList/constants';
import { KubernetesPlansPanel } from '../KubernetesPlansPanel/KubernetesPlansPanel';

import type {
  KubeNodePoolResponse,
  LinodeTypeClass,
  Region,
} from '@linode/api-v4';
import type { ExtendedType } from 'src/utilities/extendType';

const DEFAULT_PLAN_COUNT = 3;

export interface NodePoolPanelProps {
  addNodePool: (pool: Partial<KubeNodePoolResponse>) => any; // Has to accept both extended and non-extended pools
  apiError?: string;
  hasSelectedRegion: boolean;
  isAPLEnabled?: boolean;
  isPlanPanelDisabled: (planType?: LinodeTypeClass) => boolean;
  isSelectedRegionEligibleForPlan: (planType?: LinodeTypeClass) => boolean;
  regionsData: Region[];
  selectedRegionId: Region['id'] | undefined;
  types: ExtendedType[];
  typesError?: string;
  typesLoading: boolean;
}

export const NodePoolPanel = (props: NodePoolPanelProps) => {
  return <RenderLoadingOrContent {...props} />;
};

const RenderLoadingOrContent = (props: NodePoolPanelProps) => {
  const { typesError, typesLoading } = props;

  if (typesError) {
    return <ErrorState errorText={typesError} />;
  }

  if (typesLoading) {
    return <CircleProgress />;
  }

  return <Panel {...props} />;
};

const Panel = (props: NodePoolPanelProps) => {
  const {
    addNodePool,
    apiError,
    hasSelectedRegion,
    isAPLEnabled,
    isPlanPanelDisabled,
    isSelectedRegionEligibleForPlan,
    regionsData,
    selectedRegionId,
    types,
  } = props;

  const {
    isDiskEncryptionFeatureEnabled,
  } = useIsDiskEncryptionFeatureEnabled();

  const { isAcceleratedLKEPlansEnabled } = useIsAcceleratedPlansEnabled();

  const regions = useRegionsQuery().data ?? [];

  const [typeCountMap, setTypeCountMap] = React.useState<Map<string, number>>(
    new Map()
  );
  const [selectedType, setSelectedType] = React.useState<string | undefined>();

  const extendedTypes = types.map(extendType);

  const addPool = (selectedPlanType: string, nodeCount: number) => {
    addNodePool({
      count: nodeCount,
      id: Math.random(),
      type: selectedPlanType,
    });
  };

  const updatePlanCount = (planId: string, newCount: number) => {
    setTypeCountMap(new Map(typeCountMap).set(planId, newCount));
    setSelectedType(planId);
  };

  const regionSupportsDiskEncryption = doesRegionSupportFeature(
    selectedRegionId ?? '',
    regions,
    'Disk Encryption'
  );

  return (
    <Grid container direction="column">
      <Grid>
        <KubernetesPlansPanel
          copy={
            isDiskEncryptionFeatureEnabled && regionSupportsDiskEncryption
              ? ADD_NODE_POOLS_DESCRIPTION
              : 'Add groups of Linodes to your cluster. You can have a maximum of 100 Linodes per node pool.'
          }
          getTypeCount={(planId) =>
            typeCountMap.get(planId) ?? DEFAULT_PLAN_COUNT
          }
          types={extendedTypes.filter((t) => {
            if (!isAcceleratedLKEPlansEnabled && t.class === 'accelerated') {
              // Accelerated plans will appear only if they are enabled (account capability exists and feature flag on)
              return false;
            }

            // No Nanodes or GPUs in Kubernetes clusters
            return t.class !== 'nanode' && t.class !== 'gpu';
          })}
          error={apiError}
          hasSelectedRegion={hasSelectedRegion}
          header="Add Node Pools"
          isAPLEnabled={isAPLEnabled}
          isPlanPanelDisabled={isPlanPanelDisabled}
          isSelectedRegionEligibleForPlan={isSelectedRegionEligibleForPlan}
          onAdd={addPool}
          onSelect={(newType: string) => setSelectedType(newType)}
          regionsData={regionsData}
          resetValues={() => null} // In this flow we don't want to clear things on tab changes
          selectedId={selectedType}
          selectedRegionId={selectedRegionId}
          updatePlanCount={updatePlanCount}
        />
      </Grid>
    </Grid>
  );
};
