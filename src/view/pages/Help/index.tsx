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
 *  - general developer information: documentation site, GitHub organisation
 *    and the configured backends' API docs (YAC serves its interactive
 *    OpenAPI documentation at its root URL).
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

            <h3 className="mb-3 text-title-sm font-bold text-plainfont">Developer Information</h3>
            <p className="mb-5">
              VAYS is a web interface for managing configuration entities — the forms, the YAML
              editor and the validation you see here are all generated from the specification that
              your administrators maintain in the backend (YAC). Both frontend and backend are open
              source software developed at ETH Zürich.
            </p>
            <p className="mb-5">
              If something does not work as expected, or you have a question or an idea, please open
              an issue or a discussion on GitHub. For questions about the entities themselves (what
              a field means, why a value is rejected), the field descriptions and your
              administrators are the best starting point.
            </p>

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

            <p className="mt-6 mb-1 text-plainfont font-bold">Backend APIs</p>
            <p className="mb-3">
              Everything shown in this interface is also available programmatically. Each configured
              backend serves its interactive API documentation at its root URL:
            </p>
            {backends.map((backend) => (
              <HelpLink
                key={backend.name}
                label={backend.title}
                href={backend.url}
                text={backend.url}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Help;
