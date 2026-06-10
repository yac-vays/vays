import { ControlProps, OwnPropsOfControl } from '@jsonforms/core';
import {
  ctxDispatchToControlProps,
  ctxToArrayLayoutProps,
  ctxToControlProps,
  JsonFormsStateContext,
  withJsonFormsContext,
} from '@jsonforms/react';
import React, { ComponentType } from 'react';

const withContextToControlProps = (
  Component: ComponentType<ControlProps>,
): ComponentType<OwnPropsOfControl> =>
  //@ts-expect-error .............................
  function WithContextToControlProps({ ctx, props }: JsonFormsStateContext & ControlProps) {
    const controlProps = ctxToControlProps(ctx, props);
    const arrayLayoutProps = ctxToArrayLayoutProps(ctx, props);
    // Dedupe error lines. (Spread the Set: `Iterator.prototype.reduce` is
    // ES2025 and not available in older Safari/Firefox.)
    controlProps.errors = [...new Set(arrayLayoutProps.errors.split('\n'))].join('\n');
    const dispatchProps = ctxDispatchToControlProps(ctx.dispatch);
    return <Component {...props} {...controlProps} {...dispatchProps} />;
  };

export const withJsonFormsControlPropsAndArrayLevelErrors = (
  Component: ComponentType<ControlProps>,
  memoize = true,
): ComponentType<OwnPropsOfControl> =>
  withJsonFormsContext(withContextToControlProps(memoize ? React.memo(Component) : Component));
