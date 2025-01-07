import { UISchemaElement } from '@jsonforms/core';

export function isCustomRenderer(name: string) {
  return (uischema: UISchemaElement) => {
    return uischema.options?.renderer === name;
  };
}
