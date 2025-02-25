import Markdown from 'react-markdown';

const MarkdownRender = ({ text }: { text: string | null | undefined }) => {
  if (!text) return <></>;
  return (
    <div className="whitespace-pre-wrap">
      {text.split('\n').map((v) => (
        <>
          {'\n'}
          <Markdown
            components={{
              strong(props) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { node, ...rest } = props;
                return (
                  <>
                    <strong {...rest} />
                  </>
                );
              },
              a(props) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { node, ...rest } = props;
                return <a style={{ color: 'lightblue' }} target="_blank" {...rest} />;
              },
            }}
          >
            {v}
          </Markdown>
        </>
      ))}
    </div>
  );
};

export default MarkdownRender;
