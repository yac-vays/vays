import { useEffect, useState } from 'react';
import {
  setActivatedActions,
  setEntityName,
} from '../../../../controller/local/EditController/ExpertMode/access';
import { editViewNavigateToNewName } from '../../../../controller/local/EditController/shared';
import { getTriggerableActions } from '../../../../utils/actionUtils';
import { isNameGeneratedByYAC, isNameOptionalByYAC } from '../../../../utils/nameUtils';
import { RequestEditContext } from '../../../../utils/types/internal/request';
import ErrorRing from '../../../components/Form/ErrorRing';
import Checkbox from '../../../thirdparty/components/ifc/CheckBox/CheckBox';
import OverheadLabelWithMarkdownDescr from '../../../thirdparty/components/ifc/Label/OverheadLabel';
import TextInput from '../../../thirdparty/components/ifc/TextInput/TextInput';

const MetaInfoPanel = ({
  requestEditContext,
  updateCallback,
}: {
  requestEditContext: RequestEditContext;
  updateCallback: () => void;
}) => {
  const [nameError, setNameError] = useState<string>('');
  // The name field mirrors the logic used everywhere else (see model/action.ts,
  // utils/schema/injectName.ts): when YAC generates the name ('enforced') there
  // must be no name input at all; when the name is 'optional' it is generated if
  // left empty (hint this in the placeholder and do not mark it required).
  const accessedEntityType = requestEditContext.rc.accessedEntityType;
  const showNameField = !isNameGeneratedByYAC(accessedEntityType);
  const nameOptional = isNameOptionalByYAC(accessedEntityType);
  const namePlaceholder = nameOptional
    ? 'Generate Automatically'
    : (accessedEntityType?.name_example ?? 'Enter name...');
  const acts = getTriggerableActions(
    requestEditContext.rc.accessedEntityType?.actions ?? [],
    requestEditContext.mode,
  );
  const [actionActive, setActionActive] = useState<boolean[]>(acts.map(() => false));
  const setActionActiveAt = (idx: number, value: boolean) => {
    // Never mutate the existing state array; derive a new one.
    const next = actionActive.map((x, i) => (i === idx ? value : x));
    setActivatedActions(acts.filter((_, i) => next[i]));
    setActionActive(next);
  };

  // Track the current name so we can surface a "missing / invalid" error the same
  // way the form does for its fields (a red ring). Kept in sync if the context's
  // name changes (e.g. once an existing entity finishes loading).
  const [nameValue, setNameValue] = useState<string>(requestEditContext.entityName ?? '');
  useEffect(() => {
    setNameValue(requestEditContext.entityName ?? '');
  }, [requestEditContext.entityName]);

  const nameMissing = showNameField && !nameOptional && nameValue.trim() === '';
  const nameErrorMessage = nameMissing ? 'A name is required.' : nameError;

  return (
    <div className="flex flex-row items-end gap-4 pb-2 border-b">
      <div className="grow">
        {showNameField && (
          <>
            <OverheadLabelWithMarkdownDescr
              title="Name"
              required={!nameOptional}
              description=""
              errors={nameErrorMessage || undefined}
            />
            <ErrorRing errors={nameErrorMessage || undefined}>
              <TextInput
                placeholder={namePlaceholder}
                data={requestEditContext.entityName}
                enabled
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = e.target.value;
                  setNameValue(value);
                  const name = value === '' ? null : value;
                  setEntityName(name);
                  editViewNavigateToNewName(name, requestEditContext);
                  try {
                    if (
                      value !== '' &&
                      !RegExp(requestEditContext.rc.accessedEntityType?.name_pattern ?? '.*').test(
                        value,
                      )
                    ) {
                      setNameError(
                        'Does not match pattern ' +
                          requestEditContext.rc.accessedEntityType?.name_pattern,
                      );
                      return;
                    } else setNameError('');
                  } catch {
                    return;
                  }
                  updateCallback();
                }}
              />
            </ErrorRing>
          </>
        )}
        <div className="flex flex-col">
          {(function () {
            const jsx = acts.map((act, idx) => {
              return (
                <Checkbox
                  key={act.name ?? idx}
                  title={act.title}
                  initValue={false}
                  onChange={(checked) => {
                    setActionActiveAt(idx, checked);
                    updateCallback();
                  }}
                  description={act.description}
                />
              );
            });

            return jsx;
          })()}
        </div>
      </div>
      {/* <div className="pb-1.5">
      <Checkbox initValue={false} onChange={() => {}} title="Install" />
    </div>
     */}
    </div>
  );
};

export default MetaInfoPanel;
