import { TextField, omittedProps } from '@linode/ui';
import { styled } from '@mui/material/styles';
import * as React from 'react';

import { AccessPanel } from 'src/components/AccessPanel/AccessPanel';
import { RenderGuard } from 'src/components/RenderGuard';

import type { UserDefinedField } from '@linode/api-v4/lib/stackscripts';

interface Props {
  error?: string;
  field: UserDefinedField;
  isOptional: boolean;
  isPassword?: boolean;
  placeholder?: string;
  tooltip?: JSX.Element;
  updateFormState: (key: string, value: any) => void;
  value: string;
}

class UserDefinedText extends React.Component<Props, {}> {
  handleUpdatePassword = (value: string) => {
    const { field, updateFormState } = this.props;
    updateFormState(field.name, value);
  };

  handleUpdateText = (e: any) => {
    const { field, updateFormState } = this.props;
    updateFormState(field.name, e.target.value);
  };

  renderPasswordField = () => {
    const { error, field, isOptional, placeholder, tooltip } = this.props;

    return (
      <StyledAccessPanel
        disabledReason={tooltip}
        error={error}
        handleChange={this.handleUpdatePassword}
        hideStrengthLabel
        isOptional={isOptional}
        label={field.label}
        password={this.props.value}
        placeholder={placeholder}
        required={!isOptional}
      />
    );
  };

  renderTextField = () => {
    const { error, field, isOptional, placeholder } = this.props;

    return (
      <TextField
        errorText={error}
        helperText={placeholder}
        label={field.label}
        onChange={this.handleUpdateText}
        required={!isOptional}
        value={this.props.value}
      />
    );
  };

  render() {
    return (
      <div>
        {this.props.isPassword
          ? this.renderPasswordField()
          : this.renderTextField()}
      </div>
    );
  }
}

type StyledAccessPanelProps = Pick<Props, 'isOptional'>;

const StyledAccessPanel = styled(AccessPanel, {
  label: 'StyledAccessPanel',
  shouldForwardProp: omittedProps(['isOptional']),
})<StyledAccessPanelProps>(({ isOptional }) => ({
  padding: 0,
  ...(!isOptional && { margin: 0 }),
}));

export default RenderGuard<Props>(UserDefinedText);
