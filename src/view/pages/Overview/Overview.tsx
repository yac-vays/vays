import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  getDefaultRequestOverviewContext,
  getDefaultURL,
  getRequestContextOverview,
  isValidQueryOverview,
  navigateToURL,
} from '../../../controller/global/url';
import { invalidateEntityListCache } from '../../../model/entityList';
import { YACBackend } from '../../../utils/types/config';
import { RequestOverviewContext } from '../../../utils/types/internal/request';
import EntityList from '../../components/EntityList';
import MarkdownRender from '../../components/Markdown';
import PageHeaderTitle from '../../thirdparty/components/PageTitle/PageHeaderTitle';

interface OverviewPageProps {
  backends: Required<YACBackend[]>;
}

const Overview: React.FC<OverviewPageProps> = ({ backends }: OverviewPageProps) => {
  const { backendName, entityTypeName } = useParams();
  const [showDescription, setShowDescription] = useState<boolean>(true);
  const [requestContext, setRequestContext] = useState<RequestOverviewContext>(
    getDefaultRequestOverviewContext(),
  );

  useEffect(() => {
    (async function () {
      setShowDescription(true);
      const isValid: boolean = await isValidQueryOverview(backendName, entityTypeName, backends);
      if (!isValid) {
        // TODO: Really have to be a bit faster here!
        navigateToURL(await getDefaultURL(backends));
        // TODO: What here?
      } else {
        setRequestContext(
          await getRequestContextOverview(
            backendName as string,
            entityTypeName as string,
            backends,
          ),
        );
      }
    })();
  }, [window.location.href]);

  let title = 'Loading Type Definition...';
  let subText =
    'This is required for understanding the backend responses and verifying your request.';
  if (requestContext.rc.accessedEntityType) {
    title = `${requestContext.rc.backendObject?.title} / ${requestContext.rc.accessedEntityType.title}`;
    subText = '';
  }

  const description = requestContext.rc.accessedEntityType?.description ?? '';
  const hasDescription = description !== '';

  return (
    <>
      <PageHeaderTitle title={title} subText={subText}>
        <button
          className="text-[#98A6AD] hover:text-plainfont"
          title="Refresh"
          onClick={() =>
            invalidateEntityListCache(requestContext.rc.yacURL, requestContext.rc.entityTypeName)
          }
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="fill-current"
            height="40px"
            viewBox="0 -960 960 960"
            width="40px"
            fill="#none"
          >
            <path d="M198.67-326.67Q178-363.33 169-401t-9-77q0-132 94-226.33 94-94.34 226-94.34h31l-74.67-74.66L481-918l152.67 152.67L481-612.67 435.67-658l74-74H480q-104.67 0-179 74.5T226.67-478q0 28 5.66 53.67 5.67 25.66 15 49l-48.66 48.66ZM477.67-40 325-192.67l152.67-152.66 44.66 44.66L447.67-226H480q104.67 0 179-74.5T733.33-480q0-28-5.33-53.67-5.33-25.66-16-49l48.67-48.66q20.66 36.66 30 74.33 9.33 37.67 9.33 77 0 132-94 226.33-94 94.34-226 94.34h-32.33l74.66 74.66L477.67-40Z" />
          </svg>
        </button>
      </PageHeaderTitle>
      {hasDescription && (
        <div className="-mt-3 mb-5" style={{ whiteSpace: 'pre-wrap' }}>
          {showDescription && (
            <div className="text-medium md:text-title-sm">
              <MarkdownRender text={description} />
            </div>
          )}
          <a
            className="cursor-pointer text-sm text-[#98A6AD] hover:text-plainfont"
            onClick={() => setShowDescription(!showDescription)}
          >
            {showDescription ? 'Hide Description' : 'Show Description'}
          </a>
        </div>
      )}

      <EntityList requestContext={requestContext.rc} />
    </>
  );
};

export default Overview;
