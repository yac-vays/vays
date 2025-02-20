import { useState } from 'react';
import {
  setActivatedActions,
  setEntityName,
} from '../../../../controller/local/EditController/ExpertMode/access';
import { editViewNavigateToNewName } from '../../../../controller/local/EditController/shared';
import { getTriggerableActions } from '../../../../utils/actionUtils';
import { RequestEditContext } from '../../../../utils/types/internal/request';
import Checkbox from '../../../thirdparty/components/ifc/CheckBox/CheckBox';
import ErrorBox from '../../../thirdparty/components/ifc/Label/ErrorBox';
import OverheadLabel from '../../../thirdparty/components/ifc/Label/OverheadLabel';
import TextInput from '../../../thirdparty/components/ifc/TextInput/TextInput';

const MetaInfoPanel = ({
  requestEditContext,
  updateCallback,
}: {
  requestEditContext: RequestEditContext;
  updateCallback: () => void;
}) => {
  const [nameError, setNameError] = useState<string>('');
  const acts = getTriggerableActions(
    requestEditContext.rc.accessedEntityType?.actions ?? [],
    requestEditContext.mode,
  );
  const [actionActive, _setActionActive] = useState<boolean[]>(acts.map(() => false));
  const setActionActive = (v: boolean[]) => {
    setActivatedActions(acts.filter((_, idx) => v[idx]));
    _setActionActive(v);
  };

  return (
    <div className="flex flex-row items-end gap-4 pb-2 border-b">
      <div className="grow">
        <OverheadLabel title="Entity Name" required={true} description="" />
        <TextInput
          placeholder={
            requestEditContext.rc.accessedEntityType?.name_example
              ? requestEditContext.rc.accessedEntityType?.name_example
              : 'Enter name...'
          }
          data={requestEditContext.entityName}
          enabled
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const name = e.target.value === '' ? null : e.target.value;
            if (name == null) return;
            setEntityName(name);
            editViewNavigateToNewName(name, requestEditContext);
            try {
              if (
                !RegExp(requestEditContext.rc.accessedEntityType?.name_pattern ?? '.*').test(name)
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
        <ErrorBox displayError={nameError} />
        <div className="flex flex-col">
          {(function () {
            const jsx = acts.map((v, idx) => {
              return (
                <Checkbox
                  title={v.title}
                  initValue={false}
                  onChange={(v) => {
                    actionActive[idx] = v;
                    setActionActive(actionActive);
                    updateCallback();
                  }}
                  description={v.description}
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
