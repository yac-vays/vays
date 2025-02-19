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
    controlProps.errors = arrayLayoutProps.errors;
    const dispatchProps = ctxDispatchToControlProps(ctx.dispatch);
    return <Component {...props} {...controlProps} {...dispatchProps} />;
  };

export const withJsonFormsControlPropsAndArrayLevelErrors = (
  Component: ComponentType<ControlProps>,
  memoize = true,
): ComponentType<OwnPropsOfControl> =>
  withJsonFormsContext(withContextToControlProps(memoize ? React.memo(Component) : Component));
