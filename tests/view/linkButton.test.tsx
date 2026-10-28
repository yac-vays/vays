import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import LinkButton from '../../src/view/components/Buttons/LinkButton';

const LINK = { name: 'repo', title: 'GitLab', icon: '<svg/>' };

test('an applicable link opens its URL in a new tab', () => {
  const html = renderToStaticMarkup(
    <LinkButton link={LINK} url="https://git.example.com/a" isLeft={true} />,
  );
  expect(html).toContain('href="https://git.example.com/a"');
  expect(html).toContain('target="_blank"');
  expect(html).toContain('rel="noopener noreferrer"');
  expect(html).toContain('title="GitLab"');
});

test('a link not applicable to the entity is a faded placeholder', () => {
  const html = renderToStaticMarkup(<LinkButton link={LINK} url={undefined} isLeft={false} />);
  expect(html).not.toContain('<a');
  expect(html).toContain('title="GitLab (not available)"');
  expect(html).toContain('opacity:0.2');
});
