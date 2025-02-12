import { parse } from 'yaml';
import { onSuccessfullPatch } from '.';
import { getEntityData } from '../../../../model/entityData';
import { patchEntity } from '../../../../model/patch';
import { getObjectDiff, transformObjectUsingTitle } from '../../../../utils/objectdiff';
import { RequestEditContext } from '../../../../utils/types/internal/request';
import { showModalMessage } from '../../../global/modal';
import { getInitialEntityYAML, retreiveSchema } from '../shared';

export function handleCollision(
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  patch: any,
  requestEditContext: RequestEditContext,
  oldYaml?: string,
): void {
  setTimeout(
    () =>
      showModalMessage(
        'Ops! Someone just edited too!',
        'Looks like while you were editing, someone else has changed the data too. If you continue, you may overwrite the changes they have done: ',
        async () => {
          const success = await patchEntity(
            name,
            patch,
            requestEditContext,
            getInitialEntityYAML(),
          );
          if (success) {
            onSuccessfullPatch(requestEditContext);
          }
        },
        async () => {},
        'Overwrite Changes',
        false,
        undefined,
        { name, requestEditContext, oldYaml },
      ),
    100,
  );
}

/**
 *
 * @param name
 * @param requestEditContext
 * @param oldYaml
 * @returns
 *
 * @note Guarantee: Restarts the editing session.
 */
export async function collisionGetDiff(
  name: string,
  requestEditContext: RequestEditContext,
  oldYaml?: string,
): Promise<string> {
  const newEntityData = await getEntityData(name, requestEditContext.rc);
  /**
   * Set the startEditingSession to true to actually restart the internal editing session
   * (set initialYAML, intial data again)
   */
  const schema = await retreiveSchema(requestEditContext, false, false, true);
  return JSON.stringify(
    transformObjectUsingTitle(
      getObjectDiff(parse(oldYaml ?? '{}'), newEntityData?.data),
      schema?.json_schema,
    ),
  );
}
