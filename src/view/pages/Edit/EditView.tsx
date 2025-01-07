import React, { useEffect, useState } from 'react';
import PageHeaderTitle from '../../thirdparty-based-components/PageTitle/PageHeaderTitle';
import {
  EditViewMode,
  getDefaultEditContext,
  getDefaultURL,
  getRequestContextEdit,
  isValidQueryEdit,
  navigateToURL,
  RequestEditContext,
} from '../../../controller/global/URLValidation';
import { useParams, useSearchParams } from 'react-router-dom';
import { YACBackend } from '../../../model/ConfigFetcher';
import { NameGeneratedCond } from '../../../model/EntityListFetcher';
import StandardEditMode from './StandardEditMode/StandardEditMode';
import ExpertMode from './ExpertMode/ExpertMode';
import EditFrame from './EditFrame';
import iSessionStorage from '../../../session/storage/SessionStorage';
import { showModalMessage } from '../../../controller/global/ModalController';

interface EditViewProps {
  backends: Required<YACBackend[]>;
  mode: EditViewMode;
}

const EditView: React.FC<EditViewProps> = ({ backends, mode }: EditViewProps) => {
  const { backendName, entityTypeName, entityName } = useParams();
  const [isExpertMode, _setIsExpertMode] = useState<boolean>(iSessionStorage.getIsExpertMode());
  const searchParams = useSearchParams()[0];
  const [requestContext, setRequestContext] = useState<RequestEditContext>(getDefaultEditContext());
  const [title, setTitle] = useState<string>('Loading...');

  const setIsExpertMode = (v: boolean) => {
    _setIsExpertMode(v);
    iSessionStorage.setIsExpertMode(v);
    navigateToURL(window.location.pathname + '?mode=' + (v ? 'expert' : 'standard'));
  };

  useEffect(() => {
    (async function () {
      const isValid: boolean = await isValidQueryEdit(
        backendName,
        entityTypeName,
        entityName,
        backends,
        mode,
      );
      if (!isValid) {
        // TODO: Really have to be a bit faster here!
        navigateToURL(await getDefaultURL(backends));
        // TODO: What here?
      } else {
        const requestEditContext = await getRequestContextEdit(
          backendName as string,
          entityTypeName as string,
          backends,
          mode,
          entityName,
          searchParams.get('mode') ??
            (iSessionStorage.getIsExpertMode() ? 'expert' : 'standard') ??
            'standard',
        );
        if (
          (requestEditContext.viewMode === 'expert' && !isExpertMode) ||
          (requestEditContext.viewMode === 'standard' && isExpertMode)
        ) {
          // Resolve conflict URL vs personal settings.
          setIsExpertMode(requestEditContext.viewMode === 'expert');
        } else {
          // make sure that the URL has the viewMode in the URL, May not be the case
          // just yet since some validation just took place and may have overwritten the mode there.
          navigateToURL(
            window.location.pathname +
              '?mode=' +
              (requestEditContext.viewMode === 'expert' ? 'expert' : 'standard'),
          );
        }

        if (
          mode === 'create' &&
          requestEditContext.rc.accessedEntityType?.name_generated === NameGeneratedCond.enforced
        )
          requestEditContext.entityName = undefined;

        if (mode === 'create') {
          const entityTypeSingular = requestEditContext.rc.accessedEntityType?.title.substring(
            0,
            requestEditContext.rc.accessedEntityType?.title.length - 1,
          );
          const backendTitle = requestEditContext.rc.backendObject?.title;
          if (requestEditContext.entityName == null)
            setTitle(`Adding a ${entityTypeSingular} to ${backendTitle}`);
          else
            setTitle(
              `Adding ${entityTypeSingular} '${requestEditContext.entityName}' to ${backendTitle}`,
            );
        } else {
          setTitle(
            `Editing ${requestEditContext.rc.accessedEntityType?.title.substring(
              0,
              requestEditContext.rc.accessedEntityType?.title.length - 1,
            )} '${entityName}' on ${requestEditContext.rc.backendObject?.title}`,
          );
        }
        setRequestContext(requestEditContext);
      }
    })();
  }, [window.location.href]);

  return (
    <>
      <PageHeaderTitle
        title={title}
        subText={
          isExpertMode
            ? 'Press F1 to get all commands. Hover over a key or an error (icon or squiggly line) to display more info.'
            : ''
        }
      >
        <button
          title={isExpertMode ? 'Toggle Standard Mode' : 'Toggle Expert Mode'}
          className="text-[#98A6AD] hover:text-body"
          onClick={(e) => {
            e.currentTarget.blur();
            showModalMessage(
              'Are You Sure To Switch Editing Mode?',
              'Any data you have entered but not yet saved (button in the bottom right corner) will be lost.',
              async () => setIsExpertMode(!isExpertMode),
              async () => {},
              'Switch to ' + (isExpertMode ? 'Standard Mode' : 'Expert Mode'),
            );
          }}
        >
          {isExpertMode ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="fill-current"
              height="40px"
              viewBox="0 -960 960 960"
              width="40px"
              fill="#none"
            >
              <path d="M120-840h320v320H120v-320Zm80 80v160-160Zm320-80h320v320H520v-320Zm80 80v160-160ZM120-440h320v320H120v-320Zm80 80v160-160Zm440-80h80v120h120v80H720v120h-80v-120H520v-80h120v-120Zm-40-320v160h160v-160H600Zm-400 0v160h160v-160H200Zm0 400v160h160v-160H200Z" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="fill-current"
              height="40px"
              viewBox="0 -960 960 960"
              width="40px"
              fill="#none"
            >
              <path d="m384-336 56-57-87-87 87-87-56-57-144 144 144 144Zm192 0 144-144-144-144-56 57 87 87-87 87 56 57ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm0-560v560-560Z" />
            </svg>
          )}
        </button>
      </PageHeaderTitle>

      <EditFrame requestEditContext={requestContext} isExpertMode={isExpertMode} />
    </>
  );
};

export default EditView;
