import { useEffect, useState } from 'react';
// import { getConfig } from '../../../model/ConfigFetcher';
import PageHeaderTitle from '../../thirdparty-based-components/PageTitle/PageHeaderTitle';

const DevInfo = () => {
  const [backends, setBackends] = useState<React.ReactNode>(undefined);

  useEffect(() => {
    // (async () => {
    //   const conf = await getConfig();
    //   if (conf == null) return;
    //   const jsx = [];
    //   for (const be of conf.backends) {
    //     jsx.push(
    //       <p>
    //         <span className="font-lg text-black dark:text-white font-bold">{be.title + ' : '}</span>
    //         <a href={be.url} target="_blank" style={{ color: 'lightblue' }}>
    //           Documentation
    //         </a>
    //       </p>,
    //     );
    //   }
    //   setBackends(jsx);
    // })();
    setTimeout(() => {
      setBackends(<p>Backend information will be displayed here.</p>);
    }, 1000);
  }, []);

  return (
    <>
      <PageHeaderTitle title="Developer Information" subText="" />
      <section className="rounded-sm border border-stroke bg-white py-4 shadow-default dark:border-strokedark dark:bg-boxdark">
        <div
          className="max-w-screen-xl mx-4 flex md:mx-8"
          style={{
            height: 'calc(100vh - 250px)',
          }}
        >
          <div className="w-full text-lg overflow-y-auto">
            Both, the frontend (powered by VAYS) and the backend (powered by YAC) are fully open
            sourced software developed at ETH Zürich. The repositories are at
            <p className="my-5">
              <span className="font-lg text-black dark:text-white font-bold">
                Frontend Repository (VAYS):{' '}
              </span>
              <a href="https://duckduckgo.com" style={{ color: 'red' }} target="_blank">
                Link Nonexistent
              </a>
              <br />
              <span className="font-lg text-black dark:text-white font-bold">
                Backend Repository (YAC):{' '}
              </span>
              <a href="https://duckduckgo.com" style={{ color: 'red' }} target="_blank">
                Link Nonexistent
              </a>
            </p>
            For the backend APIs, have a look at the documentation:
            {backends}
          </div>
        </div>
      </section>
    </>
  );
};

export default DevInfo;
