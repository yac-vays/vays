import { useEffect, useState } from 'react';
import { getConfig } from '../../../model/config';
import { YACBackend } from '../../../utils/types/config';
import PageHeaderTitle from '../../thirdparty/components/PageTitle/PageHeaderTitle';
import FieldCatalog from '../Help/FieldCatalog';

/**
 * Dedicated Configuration Documentation page (`/docs`), displaying all
 * possible configuration fields, allowed values, and validation constraints
 * for each backend and entity type, and clearly marking fields that cannot be
 * edited by standard users and must be requested via the support group.
 */
const Docs = ({ backends: initialBackends }: { backends?: YACBackend[] }) => {
  const [backends, setBackends] = useState<YACBackend[]>(initialBackends ?? []);

  useEffect(() => {
    if (initialBackends && initialBackends.length > 0 && initialBackends[0].url !== '') {
      setBackends(initialBackends);
      return;
    }
    (async () => {
      const conf = await getConfig();
      if (conf == null) return;
      setBackends(conf.backends ?? []);
    })();
  }, [initialBackends]);

  return (
    <>
      <PageHeaderTitle title="Configuration Reference" />
      <section className="rounded-xs border border-stroke bg-white p-4 shadow-default md:p-6 dark:bg-boxdark">
        <FieldCatalog backends={backends} />
      </section>
    </>
  );
};

export default Docs;
