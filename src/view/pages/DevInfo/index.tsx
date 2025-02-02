import { useEffect, useState } from 'react';
import { getConfig } from '../../../model/config';
import PageHeaderTitle from '../../thirdparty-based-components/PageTitle/PageHeaderTitle';

const DevInfo = () => {
  const [backends, setBackends] = useState<React.ReactNode>(undefined);

  useEffect(() => {
    (async () => {
      console.error('Execute again....');
      const conf = await getConfig();
      if (conf == null) return;
      const jsx = [];
      for (const be of conf.backends) {
        jsx.push(
          <p>
            <span className="font-lg text-plainfont font-bold">{be.title + ' : '}</span>
            <a href={be.url} target="_blank" style={{ color: 'lightblue' }}>
              Documentation{' '}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="fill-current opacity-40 inline pl-0.5 cursor-pointer"
                height="20px"
                viewBox="0 -960 960 960"
                width="20px"
              >
                <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z" />
              </svg>
            </a>
          </p>,
        );
      }
      setBackends(jsx);
    })();
  }, []);

  return (
    <>
      <PageHeaderTitle title="Developer Information" subText="" />
      <section className="rounded-sm border border-stroke bg-white py-4 shadow-default dark:bg-boxdark">
        <div
          className="max-w-screen-xl mx-4 flex md:mx-8"
          style={{
            height: 'calc(100vh - 250px)',
          }}
        >
          <div className="w-full text-lg overflow-y-auto">
            Both, frontend and backend are open source software developed at ETH Zürich. If you
            experience any issues with the software itself, please open an issue in one of the
            repositories below. For questions regarding the software, you may also open a discussion
            in the{' '}
            <a style={{ color: 'lightblue' }} href="https://github.com/yac-vays" target="_blank">
              corresponding organisation.{' '}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="fill-current opacity-40 inline pl-0.5 cursor-pointer"
                height="16px"
                viewBox="0 -960 960 960"
                width="16px"
              >
                <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z" />
              </svg>
            </a>
            <p className="my-5">
              <span className="font-lg text-plainfont font-bold">Frontend Repository (VAYS): </span>
              <a
                href="https://github.com/yac-vays/vays"
                style={{ color: 'lightblue' }}
                target="_blank"
              >
                Github{' '}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="fill-current opacity-40 inline pl-1 cursor-pointer"
                  height="20px"
                  viewBox="0 -960 960 960"
                  width="20px"
                >
                  <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z" />
                </svg>
              </a>
              <br />
              <span className="font-lg text-plainfont font-bold">Backend Repository (YAC): </span>
              <a
                href="https://github.com/yac-vays/yac"
                style={{ color: 'lightblue' }}
                target="_blank"
              >
                Github{' '}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="fill-current opacity-40 inline pl-1 cursor-pointer"
                  height="20px"
                  viewBox="0 -960 960 960"
                  width="20px"
                >
                  <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z" />
                </svg>
              </a>
              <br />
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
