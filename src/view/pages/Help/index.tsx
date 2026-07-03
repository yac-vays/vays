import { useEffect, useState } from 'react';
import { getConfig } from '../../../model/config';
import { YACBackend } from '../../../utils/types/config';
import MarkdownRender from '../../components/Markdown';
import PageHeaderTitle from '../../thirdparty/components/PageTitle/PageHeaderTitle';

/** Material Symbols "open in new" — marks a link leaving the app. */
const ExternalLinkIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="fill-current opacity-40 inline pl-0.5"
    height="18px"
    viewBox="0 -960 960 960"
    width="18px"
  >
    <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z" />
  </svg>
);

const HelpLink = ({ label, href, text }: { label: string; href: string; text: string }) => (
  <p className="my-3">
    <span className="text-plainfont font-bold">{label}: </span>
    <a href={href} target="_blank" rel="noreferrer" className="text-primary hover:underline">
      {text}
      <ExternalLinkIcon />
    </a>
  </p>
);

/**
 * The help page (`/help`, reachable from the top bar). Two parts:
 *  - the deployment-specific help text from the app config (`helpText`,
 *    markdown) — the place for "who to contact HERE" (shown only when set);
 *  - developer information: links to the documentation site and the GitHub
 *    organisation, plus a table of the configured backends' API docs (YAC
 *    serves its interactive OpenAPI documentation at its root URL).
 */
const Help = () => {
  const [backends, setBackends] = useState<YACBackend[]>([]);
  const [helpText, setHelpText] = useState<string | undefined>(undefined);

  useEffect(() => {
    (async () => {
      const conf = await getConfig();
      if (conf == null) return;
      setBackends(conf.backends);
      setHelpText(conf.helpText);
    })();
  }, []);

  return (
    <>
      <PageHeaderTitle title="Help" />
      <section className="rounded-sm border border-stroke bg-white py-4 shadow-default dark:bg-boxdark">
        <div
          className="max-w-screen-xl mx-4 flex md:mx-8"
          style={{
            height: 'calc(100vh - 250px)',
          }}
        >
          <div className="w-full text-lg overflow-y-auto">
            {helpText && (
              <>
                <div className="mb-6">
                  <MarkdownRender text={helpText} />
                </div>
                <hr className="mb-6 border-stroke" />
              </>
            )}

            <div className="text-sm">
              <h3 className="mb-3 text-base font-bold text-plainfont">Developer Information</h3>

              <HelpLink
                label="Documentation"
                href="https://yac-vays.github.io"
                text="yac-vays.github.io"
              />
              <HelpLink
                label="GitHub"
                href="https://github.com/yac-vays"
                text="github.com/yac-vays"
              />

              <table className="mt-6 border-collapse text-left">
                <thead>
                  <tr>
                    <th className="border border-stroke py-2 px-4 font-bold text-plainfont">
                      Backend
                    </th>
                    <th className="border border-stroke py-2 px-4 font-bold text-plainfont">API</th>
                  </tr>
                </thead>
                <tbody>
                  {backends.map((backend) => (
                    <tr key={backend.name}>
                      <td className="border border-stroke py-2 px-4">{backend.title}</td>
                      <td className="border border-stroke py-2 px-4">
                        <a
                          href={backend.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline"
                        >
                          {backend.url}
                          <ExternalLinkIcon />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Help;
