import HelpOutline from '@mui/icons-material/HelpOutline';
import _Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import * as React from 'react';

import { ReloadIcon } from '../../assets';
import { rotate360 } from '../../foundations';
import { omittedProps } from '../../utilities';
import { Tooltip } from '../Tooltip';

import type { ButtonProps as _ButtonProps } from '@mui/material/Button';
import type { SxProps, Theme } from '@mui/material/styles';

export type ButtonType = 'outlined' | 'primary' | 'secondary';

const buttonTypeToColor: Record<ButtonType, _ButtonProps['color']> = {
  outlined: 'secondary', // We're treating this as a secondary
  primary: 'primary',
  secondary: 'secondary',
} as const;

const buttonTypeToVariant: Record<ButtonType, _ButtonProps['variant']> = {
  outlined: 'outlined',
  primary: 'contained',
  secondary: 'contained',
} as const;

export interface ButtonProps extends _ButtonProps {
  /**
   * The button variant to render
   * * @default 'secondary'
   * */
  buttonType?: ButtonType;
  /** Additional css class to pass to the component */
  className?: string;
  /**
   * Reduce the padding on the x-axis
   * @default false
   */
  compactX?: boolean;
  /**
   * Reduce the padding on the y-axis
   * @default false
   */
  compactY?: boolean;
  /**
   * Optional test ID
   */
  'data-testid'?: string;
  /**
   * Show a loading indicator
   * @default false
   */
  loading?: boolean;
  /** The `sx` prop can be either object or function */
  sx?: SxProps<Theme>;
  /** Pass specific CSS styling for the SVG icon. */
  sxEndIcon?: SxProps<Theme>;
  /** Tooltip analytics event */
  tooltipAnalyticsEvent?: () => void;
  /** Tooltip text */
  tooltipText?: string;
}

const StyledButton = styled(_Button, {
  shouldForwardProp: omittedProps([
    'compactX',
    'compactY',
    'loading',
    'buttonType',
  ]),
})<ButtonProps>(({ theme, ...props }) => ({
  ...(props.compactX && {
    minWidth: 50,
    paddingLeft: 0,
    paddingRight: 0,
  }),
  ...(props.compactY && {
    minHeight: 20,
    paddingBottom: 0,
    paddingTop: 0,
  }),
  ...(props.loading && {
    '& svg': {
      animation: `${rotate360} 2s linear infinite`,
      height: `${theme.spacing(2)}`,
      margin: '0 auto',
      width: `${theme.spacing(2)}`,
    },
  }),
}));

const Span = styled('span')({
  '@supports (-moz-appearance: none)': {
    /* Fix text alignment for Firefox */
    marginTop: 2,
  },
  alignItems: 'center',
  display: 'flex',
});

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      // default to secondary as some components never define a buttonType (usually buttons with icons)
      // and we end up with the wrong styles (purple color, see #6455)
      // It would be nice to remove this default and require the prop but this fixes the issue for now.
      buttonType = 'secondary',
      children,
      className,
      color,
      compactX,
      compactY,
      disabled,
      loading,
      sx,
      sxEndIcon,
      tooltipAnalyticsEvent,
      tooltipText,
      ...rest
    },
    ref
  ) => {
    const showTooltip = disabled && Boolean(tooltipText);

    const handleTooltipAnalytics = () => {
      if (tooltipAnalyticsEvent) {
        tooltipAnalyticsEvent();
      }
    };

    const handleDisabledKeyDown = (e: React.KeyboardEvent) => {
      // Disable the buttom from submitting forms when disabled
      // Allow the user to tab to the button and press
      // space or enter to trigger the tooltip.
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleTooltipAnalytics();
      }
    };

    const renderButton = (
      <StyledButton
        {...rest}
        aria-describedby={
          showTooltip ? 'button-tooltip' : rest['aria-describedby']
        }
        endIcon={
          (showTooltip && <HelpOutline sx={sxEndIcon} />) || rest.endIcon
        }
        aria-disabled={disabled}
        buttonType={buttonType}
        className={className}
        color={(color === 'error' && color) || buttonTypeToColor[buttonType]}
        compactX={compactX}
        compactY={compactY}
        data-testid={rest['data-testid'] || 'button'}
        disableRipple={disabled}
        disabled={loading}
        loading={loading}
        onClick={disabled ? (e) => e.preventDefault() : rest.onClick}
        onKeyDown={disabled ? handleDisabledKeyDown : rest.onKeyDown}
        ref={ref}
        sx={sx}
        variant={buttonTypeToVariant[buttonType] || 'text'}
      >
        <Span data-testid="loadingIcon">
          {loading ? <ReloadIcon /> : children}
        </Span>
      </StyledButton>
    );

    return showTooltip ? (
      <Tooltip
        aria-label={rest['aria-label']}
        data-testid="Tooltip"
        id="button-tooltip"
        onClick={handleTooltipAnalytics}
        title={tooltipText}
      >
        {renderButton}
      </Tooltip>
    ) : (
      renderButton
    );
  }
);
