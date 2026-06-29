import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  getDefaultRequestOverviewContext,
  getDefaultURL,
  getRequestContextOverview,
  isValidQueryOverview,
  navigateToURL,
} from '../../../controller/global/url';
import { invalidateEntityListCache } from '../../../model/entityList';
import iLocalStorage from '../../../session/persistent/LocalStorage';
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
  // The entity to highlight comes from `?name=` (see the route in App.tsx).
  const [searchParams] = useSearchParams();
  const entityName = searchParams.get('name') ?? undefined;
  const [showDescription, setShowDescription] = useState<boolean>(
    iLocalStorage.isOverviewDescriptionShown(),
  );

  // Persist the user's choice so the description stays hidden/shown across
  // navigations and sessions (until browser data is cleared).
  const toggleDescription = () => {
    const next = !showDescription;
    setShowDescription(next);
    iLocalStorage.setIsOverviewDescriptionShown(next);
  };
  const [requestContext, setRequestContext] = useState<RequestOverviewContext>(
    getDefaultRequestOverviewContext(),
  );

  useEffect(() => {
    (async function () {
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

  // Circular icon button matching the other top-bar controls (dark mode, bell).
  const circleBtn =
    'flex h-10 w-10 items-center justify-center rounded-full border-[0.5px] border-stroke ' +
    'bg-primary-5 hover:text-primary hover:scale-110 duration-300 dark:bg-meta-4 dark:text-white';

  return (
    <>
      <PageHeaderTitle title={title} subText={subText}>
        {hasDescription && (
          <button
            className={`${circleBtn} ${showDescription ? '!bg-primary !text-white' : ''}`}
            title={showDescription ? 'Hide description' : 'Show description'}
            onClick={toggleDescription}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="fill-current"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
            >
              <path d="M423.5-703.5Q400-727 400-760t23.5-56.5Q447-840 480-840t56.5 23.5Q560-793 560-760t-23.5 56.5Q513-680 480-680t-56.5-23.5ZM420-120v-480h120v480H420Z" />
            </svg>
          </button>
        )}
        <button
          className={circleBtn}
          title="Refresh table"
          onClick={() =>
            invalidateEntityListCache(requestContext.rc.yacURL, requestContext.rc.entityTypeName)
          }
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="fill-current"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
          >
            <path d="M198.67-326.67Q178-363.33 169-401t-9-77q0-132 94-226.33 94-94.34 226-94.34h31l-74.67-74.66L481-918l152.67 152.67L481-612.67 435.67-658l74-74H480q-104.67 0-179 74.5T226.67-478q0 28 5.66 53.67 5.67 25.66 15 49l-48.66 48.66ZM477.67-40 325-192.67l152.67-152.66 44.66 44.66L447.67-226H480q104.67 0 179-74.5T733.33-480q0-28-5.33-53.67-5.33-25.66-16-49l48.67-48.66q20.66 36.66 30 74.33 9.33 37.67 9.33 77 0 132-94 226.33-94 94.34-226 94.34h-32.33l74.66 74.66L477.67-40Z" />
          </svg>
        </button>
      </PageHeaderTitle>
      {hasDescription && showDescription && (
        <div className="mb-4 rounded-sm border border-stroke bg-white p-4 text-medium shadow-default md:text-title-sm dark:bg-boxdark">
          <MarkdownRender text={description} />
        </div>
      )}

      {/* Key on backend+type so switching either fully remounts the list: this
          resets the (uncontrolled) per-column search inputs, the open-search
          toggle, the search terms and pagination, which would otherwise
          persist across backends and show stale, ineffective search text. */}
      <EntityList
        key={`${requestContext.rc.yacURL}/${requestContext.rc.entityTypeName}`}
        requestContext={requestContext.rc}
        highlightEntityName={entityName}
      />
    </>
  );
};

export default Overview;
