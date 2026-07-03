import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import './markdown-styles.css';

// The default schema is GitHub-safe (no <script>, no on* handlers, etc.).
// We extend it with inline-SVG tags/attributes so aliases sent via YAC type
// specs can render symbols (incl. multi-colour brand logos with gradients).
// Everything else stays restricted to the safe default allowlist.
//
// NOTE: rehype-sanitize matches against hast *property* names, which are
// camelCased (e.g. `stroke-width` -> `strokeWidth`, `stop-color` -> `stopColor`,
// `aria-label` -> `ariaLabel`). Use those forms here or the attribute is dropped.
//
// <style> is deliberately NOT allowed: it is page-global and unscoped, so a
// single bad alias could restyle the whole UI. Flatten logos with SVGO
// (`inlineStyles` + `convertStyleToAttrs`) so colours become presentation
// attributes instead of class/style rules.
const SVG_PRESENTATION = [
  'id', 'fill', 'fillOpacity', 'fillRule', 'clipRule', 'stroke', 'strokeWidth',
  'strokeLinecap', 'strokeLinejoin', 'strokeMiterlimit', 'strokeOpacity',
  'strokeDasharray', 'opacity', 'transform',
];
const svgSchema = {
  ...defaultSchema,
  // Don't prefix ids with "user-content-": that rewrites <g id> / <linearGradient id>
  // but NOT the matching url(#id) / xlink:href="#id" references, which silently
  // breaks <use> and gradient fills. SVGO gives each logo a unique id prefix, so
  // dropping the clobber guard is safe for these trusted, self-contained SVGs.
  clobberPrefix: '',
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    'svg', 'path', 'g', 'circle', 'rect', 'line', 'polyline', 'polygon',
    'ellipse', 'defs', 'use', 'symbol', 'title',
    'linearGradient', 'radialGradient', 'stop',
  ],
  attributes: {
    ...defaultSchema.attributes,
    svg: ['viewBox', 'xmlns', 'width', 'height', 'preserveAspectRatio', 'role', 'ariaLabel', 'ariaHidden', ...SVG_PRESENTATION],
    g: ['transform', ...SVG_PRESENTATION],
    path: ['d', ...SVG_PRESENTATION],
    circle: ['cx', 'cy', 'r', ...SVG_PRESENTATION],
    rect: ['x', 'y', 'width', 'height', 'rx', 'ry', ...SVG_PRESENTATION],
    line: ['x1', 'y1', 'x2', 'y2', ...SVG_PRESENTATION],
    polyline: ['points', ...SVG_PRESENTATION],
    polygon: ['points', ...SVG_PRESENTATION],
    ellipse: ['cx', 'cy', 'rx', 'ry', ...SVG_PRESENTATION],
    use: ['href', 'xLinkHref', 'x', 'y', 'width', 'height', ...SVG_PRESENTATION],
    symbol: ['id', 'viewBox', 'preserveAspectRatio'],
    defs: ['id'],
    linearGradient: ['id', 'x1', 'y1', 'x2', 'y2', 'gradientUnits', 'gradientTransform', 'spreadMethod', 'href', 'xLinkHref'],
    radialGradient: ['id', 'cx', 'cy', 'r', 'fx', 'fy', 'fr', 'gradientUnits', 'gradientTransform', 'spreadMethod', 'href', 'xLinkHref'],
    stop: ['offset', 'stopColor', 'stopOpacity'],
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
                className="text-primary hover:underline"
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
