import { NavLink } from 'react-router-dom';
import AddButton from '../../components/Buttons/AddButton';
import { YACBackend } from '../../../model/ConfigFetcher';
import { EntityTypeDecl } from '../../../model/EntityListFetcher';

interface SidebarGroupEntryProps {
  yacBackendObject: YACBackend;
  entityDecl: EntityTypeDecl;
  href: string;
}

const SidebarGroupEntry = ({ entityDecl, href, yacBackendObject }: SidebarGroupEntryProps) => {
  const active = window.location.pathname === href || window.location.href.includes(href + '/');
  return (
    <ul className="mt-4 mb-5.5 flex flex-col gap-2.5 pl-6">
      <li>
        <div className="group relative flex flex-row items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white !text-white">
          <NavLink
            className={`duration-100 grow ${active ? 'font-bold text-lg' : 'opacity-80'}`}
            to={href}
          >
            {entityDecl.title}
          </NavLink>
          {entityDecl.create ? (
            <AddButton entityName={entityDecl.name} yacBackendObject={yacBackendObject} />
          ) : (
            <></>
          )}
        </div>
      </li>
    </ul>
  );
};

export default SidebarGroupEntry;
