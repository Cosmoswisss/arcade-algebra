import katex from 'katex';
import { Fragment } from 'react';

/** Renders the small markup used in content files: paragraphs, **bold**, `code` and $math$ (KaTeX). */
export function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n{2,}/).map((para, i) => (
        <p key={i}>
          {para.split(/(\$[^$]+\$|\*\*[^*]+\*\*|`[^`]+`)/g).map((part, j) => {
            if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
              const html = katex.renderToString(part.slice(1, -1), { throwOnError: false, output: 'html' });
              return <span key={j} dangerouslySetInnerHTML={{ __html: html }} />;
            }
            if (part.startsWith('**')) return <strong key={j}>{part.slice(2, -2)}</strong>;
            if (part.startsWith('`')) return <code key={j}>{part.slice(1, -1)}</code>;
            return <Fragment key={j}>{part}</Fragment>;
          })}
        </p>
      ))}
    </>
  );
}
