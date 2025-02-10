import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  getDefaultRequestOverviewContext,
  getDefaultURL,
  getRequestContextOverview,
  isValidQueryOverview,
  navigateToURL,
} from '../../../controller/global/url';
import { showError } from '../../../controller/local/notification';
import { invalidateEntityListCache } from '../../../model/entityList';
import { YACBackend } from '../../../utils/types/config';
import { RequestOverviewContext } from '../../../utils/types/internal/request';
import EntityList from '../../components/EntityList';
import PageHeaderTitle from '../../thirdparty/components/PageTitle/PageHeaderTitle';

interface OverviewPageProps {
  backends: Required<YACBackend[]>;
}

const Overview: React.FC<OverviewPageProps> = ({ backends }: OverviewPageProps) => {
  const { backendName, entityTypeName } = useParams();
  const [showInfoText, setShowInfoText] = useState<boolean>(false);
  const [requestContext, setRequestContext] = useState<RequestOverviewContext>(
    getDefaultRequestOverviewContext(),
  );

  useEffect(() => {
    (async function () {
      setShowInfoText(false);
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
    title = `Displaying ${requestContext.rc.accessedEntityType.title} of '${requestContext.rc.backendObject?.title}'`;
    subText = 'Click on any property to search for it.';
  }

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
        <button
          onClick={() => {
            if (requestContext.rc.accessedEntityType?.description === '') {
              showError(
                'No information text is available.',
                'Please contact your admin for further help.',
              );
            } else {
              setShowInfoText(!showInfoText);
            }
          }}
          className="text-[#98A6AD] hover:text-plainfont"
          style={{ paddingLeft: 15 }}
          title="Display Help"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="fill-current"
            height="40px"
            viewBox="0 -960 960 960"
            width="40px"
            fill="#none"
          >
            <path d="M478-240q21 0 35.5-14.5T528-290q0-21-14.5-35.5T478-340q-21 0-35.5 14.5T428-290q0 21 14.5 35.5T478-240Zm-36-154h74q0-33 7.5-52t42.5-52q26-26 41-49.5t15-56.5q0-56-41-86t-97-30q-57 0-92.5 30T342-618l66 26q5-18 22.5-39t53.5-21q32 0 48 17.5t16 38.5q0 20-12 37.5T506-526q-44 39-54 59t-10 73Zm38 314q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
          </svg>
        </button>
      </PageHeaderTitle>
      <section
        className={`rounded-sm border border-stroke bg-white shadow-default py-2 dark:bg-boxdark ${
          showInfoText ? 'block' : 'hidden'
        }`}
        style={{ whiteSpace: 'pre-wrap' }}
      >
        <div className="p-2 pl-8 pr-8">
          <b>Information</b>
          <br />
          {requestContext.rc.accessedEntityType?.description}
        </div>
      </section>

      <EntityList requestContext={requestContext.rc} />
    </>
  );
};

export default Overview;
