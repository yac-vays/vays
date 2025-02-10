import React, { useEffect, useState } from 'react';
import { buildOverviewURL } from '../../../../controller/global/url';
import { getEntityTypes } from '../../../../model/entityType';
import { userIsLoggedIn } from '../../../../session/login/tokenHandling';
import iLocalStorage from '../../../../session/persistent/LocalStorage';
import { EntityTypeDecl } from '../../../../utils/types/api';
import { YACBackend } from '../../../../utils/types/config';
import SidebarGroupEntry from './SidebarGroupEntry';
import SidebarGroupHeader from './SidebarGroupHeader';

interface SidebarLinkGroupProps {
  yacBackendObject: YACBackend;
  isOpen: boolean;
}

const SidebarGroup = ({ yacBackendObject, isOpen }: SidebarLinkGroupProps) => {
  const [open, setOpen] = useState<boolean>(
    window.location.pathname.startsWith(`/${yacBackendObject.name}/`) ||
      (iLocalStorage.isSidebarGroupExpanded(yacBackendObject.name) ?? isOpen),
  );
  const [entityList, setEntityList] = useState<EntityTypeDecl[]>([]);

  // https://codedamn.com/news/reactjs/handle-async-functions-with-ease
  // Really annoying, but this is what JavaScript has done to us...
  useEffect(() => {
    async function loadingEntityTypes() {
      if (window.location.pathname.startsWith('/oauth2-redirect')) {
        while (!userIsLoggedIn()) {
          await new Promise((res) => setTimeout(res, 500));
        }
      }
      const data = await getEntityTypes(yacBackendObject);
      setEntityList(data);
    }
    loadingEntityTypes();
  }, [yacBackendObject]);

  const handleClick = () => {
    iLocalStorage.setIsSidebarGroupExpanded(yacBackendObject.name, !open);
    setOpen(!open);
  };

  return (
    <li>
      <React.Fragment>
        <div
          className="group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium text-bodydark1 duration-300 ease-in-out 
          bg-primary-highlighted dark:bg-meta-4"
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.preventDefault();
            handleClick();
          }}
        >
          <SidebarGroupHeader
            open={open}
            showHandle={entityList.length > 0}
            yacBackendObject={yacBackendObject}
          />
        </div>
        {/* <!-- Dropdown Menu Start --> */}
        <div className={`translate transform overflow-hidden ${!open && 'hidden'}`}>
          {(function () {
            let jsx: React.ReactNode[] = [];
            let etList: EntityTypeDecl[] = entityList;
            let i: number = 0;
            for (let et of etList) {
              jsx.push(
                <SidebarGroupEntry
                  entityDecl={et}
                  key={i++}
                  href={buildOverviewURL(yacBackendObject, et.name)}
                  yacBackendObject={yacBackendObject}
                />,
              );
            }

            return jsx;
          })()}
        </div>
        {/* <!-- Dropdown Menu End --> */}
      </React.Fragment>
    </li>
  );
};

export default SidebarGroup;
