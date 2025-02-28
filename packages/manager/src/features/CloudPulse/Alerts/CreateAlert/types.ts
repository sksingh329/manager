import type {
  AlertServiceType,
  AlertSeverityType,
  CreateAlertDefinitionPayload,
  DimensionFilter,
  DimensionFilterOperatorType,
  MetricAggregationType,
  MetricCriteria,
  MetricOperatorType,
  TriggerCondition,
} from '@linode/api-v4';

export interface CreateAlertDefinitionForm
  extends Omit<
    CreateAlertDefinitionPayload,
    'rule_criteria' | 'severity' | 'trigger_conditions'
  > {
  engineType: null | string;
  entity_ids: string[];
  region: string;
  rule_criteria: {
    rules: MetricCriteriaForm[];
  };
  serviceType: AlertServiceType | null;
  severity: AlertSeverityType | null;
  trigger_conditions: TriggerConditionForm;
}

export interface MetricCriteriaForm
  extends Omit<
    MetricCriteria,
    'aggregation_type' | 'dimension_filters' | 'metric' | 'operator'
  > {
  aggregation_type: MetricAggregationType | null;
  dimension_filters: DimensionFilterForm[];
  metric: null | string;
  operator: MetricOperatorType | null;
}

export interface DimensionFilterForm
  extends Omit<DimensionFilter, 'dimension_label' | 'operator' | 'value'> {
  dimension_label: null | string;
  operator: DimensionFilterOperatorType | null;
  value: null | string;
}

export interface TriggerConditionForm
  extends Omit<
    TriggerCondition,
    'evaluation_period_seconds' | 'polling_interval_seconds'
  > {
  evaluation_period_seconds: null | number;
  polling_interval_seconds: null | number;
}
