import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import './markdown-styles.css';

// The default schema is GitHub-safe (no <script>, no on* handlers, etc.).
// We extend it with inline-SVG tags/attributes so aliases sent via YAC type
// specs can render symbols. Everything else stays restricted to the safe
// default allowlist.
const svgSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    'svg', 'path', 'g', 'circle', 'rect', 'line',
    'polyline', 'polygon', 'ellipse', 'defs', 'use', 'symbol', 'title',
  ],
  attributes: {
    ...defaultSchema.attributes,
    svg: ['viewBox', 'xmlns', 'width', 'height', 'fill', 'stroke', 'class', 'role', 'aria-hidden', 'aria-label'],
    path: ['d', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'fill-rule', 'clip-rule'],
    g: ['fill', 'stroke', 'transform'],
    circle: ['cx', 'cy', 'r', 'fill', 'stroke', 'stroke-width'],
    rect: ['x', 'y', 'width', 'height', 'rx', 'ry', 'fill', 'stroke', 'stroke-width'],
    line: ['x1', 'y1', 'x2', 'y2', 'stroke', 'stroke-width'],
    polyline: ['points', 'fill', 'stroke', 'stroke-width'],
    polygon: ['points', 'fill', 'stroke', 'stroke-width'],
    ellipse: ['cx', 'cy', 'rx', 'ry', 'fill', 'stroke', 'stroke-width'],
    use: ['href'],
  },
};

const MarkdownRender = ({ text }: { text: string | null | undefined }) => {
  if (!text) return <></>;
  return (
    <div className="markdown-body">
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, svgSchema]]}
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
