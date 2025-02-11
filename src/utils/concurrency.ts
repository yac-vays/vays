import { parse } from 'yaml';
import { showModalMessage } from '../controller/global/modal';
import { retreiveSchema } from '../controller/local/EditController/shared';
import { getEntityData } from '../model/entityData';
import { getObjectDiff, transformObjectUsingTitle } from './objectdiff';
import { RequestEditContext } from './types/internal/request';

export async function handleCollision(
  name: string,
  patch: any,
  requestEditContext: RequestEditContext,
  oldYaml?: string,
) {
  const newEntityData = await getEntityData(name, requestEditContext.rc);
  const schema = await retreiveSchema(requestEditContext, false, false);

  setTimeout(
    () =>
      showModalMessage(
        'Ops! Someone just edited too!',
        'Looks like while you were editing, someone else has changed the data too. If you continue, you may overwrite some of the changes that have happened: ' +
          JSON.stringify(
            transformObjectUsingTitle(
              getObjectDiff(parse(oldYaml ?? '{}'), newEntityData?.data),
              schema?.json_schema,
            ),
          ) +
          '\n\nWhen in doubt, go check this entity in another tab.',
        async () => {},
        async () => {},
        'Overwrite Changes',
        false,
      ),
    100,
  );
}
