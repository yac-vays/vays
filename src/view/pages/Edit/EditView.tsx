import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  getDefaultEditContext,
  getDefaultURL,
  getRequestContextEdit,
  isValidQueryEdit,
  navigateToURL,
} from '../../../controller/global/url';
import { YACBackend } from '../../../utils/types/config';
import { EditViewMode, RequestEditContext } from '../../../utils/types/internal/request';
import PageHeaderTitle from '../../thirdparty/components/PageTitle/PageHeaderTitle';
import EditFrame from './EditFrame';

interface EditViewProps {
  backends: Required<YACBackend[]>;
  mode: EditViewMode;
}

/**
 * EditView renders the edit page for an entity: it validates the URL params,
 * builds the request context, sets the title and hands everything to the frame
 * (a single editor with a form pane and a YAML pane).
 *
 * @param {Backend[]} props.backends - The list of backends available.
 * @param {EditViewMode} props.mode - The operation: 'create', 'edit' or 'read'.
 *
 * @returns {JSX.Element} The rendered EditView component.
 *
 * @component
 **/
const EditView: React.FC<EditViewProps> = ({ backends, mode }: EditViewProps): JSX.Element => {
  const { backendName, entityTypeName, entityName } = useParams();
  const [requestContext, setRequestContext] = useState<RequestEditContext>(getDefaultEditContext());
  const [title, setTitle] = useState<React.ReactNode>('Loading...');

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
        navigateToURL(await getDefaultURL(backends));
        return;
      }
      const requestEditContext = await getRequestContextEdit(
        backendName as string,
        entityTypeName as string,
        backends,
        mode,
        entityName,
      );
      const entityTypeTitle = requestEditContext.rc.accessedEntityType?.title;
      const backendTitle = requestEditContext.rc.backendObject?.title;

      if (mode === 'create') {
        if (requestEditContext.entityName == null)
          setTitle(
            <>
              {backendTitle} / {entityTypeTitle} / Create: <i>New</i>
            </>,
          );
        else
          setTitle(
            `${backendTitle} / ${entityTypeTitle} / Create: '${requestEditContext.entityName}'`,
          );
      } else if (mode === 'edit') {
        setTitle(`${backendTitle} / ${entityTypeTitle} / Edit: '${requestEditContext.entityName}'`);
      } else {
        setTitle(`${backendTitle} / ${entityTypeTitle} / Read: '${requestEditContext.entityName}'`);
      }
      setRequestContext(requestEditContext);
    })();
  }, [window.location.href]);

  return (
    <>
      <PageHeaderTitle
        title={title}
        subText={
          'Edit via the form, the YAML editor, or both — they stay in sync. ' +
          'In the YAML editor press F1 for all commands; hover an error to see details.'
        }
      />

      <EditFrame requestEditContext={requestContext} />
    </>
  );
};

export default EditView;
