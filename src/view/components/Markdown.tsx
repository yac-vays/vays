import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MarkdownRender = ({ text }: { text: string | null | undefined }) => {
  if (!text) return <></>;
  return (
    <div className="whitespace-pre-wrap">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          a({ href, children }) {
            return (
              <a
                style={{ color: 'lightblue' }}
                target="_blank"
                rel="noopener noreferrer"
                href={href}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {text}
      </Markdown>
    </div>
  );
};

export default MarkdownRender;
