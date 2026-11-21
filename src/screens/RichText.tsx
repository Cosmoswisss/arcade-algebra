import katex from 'katex';
import type { ReactNode } from 'react';

/** Renders the small Markdown subset used in content: paragraphs, **bold**, *italic*, $math$ and (x, y) coordinates in mono. */
export default function RichText({ text, className }: { text: string; className?: string }) {
  return <div className={className}>{text.split('\n').filter(Boolean).map((p, k) => <p key={k}>{inline(p)}</p>)}</div>;
}

function inline(s: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\$[^$]+\$|\*\*[^*]+\*\*|\*[^*]+\*|\(-?[\d.]+, ?[−-]?[\d.]+\))/g;
  let last = 0, m: RegExpExecArray | null, k = 0;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index));
    const t = m[0];
    if (t.startsWith('$')) out.push(<span key={k++} dangerouslySetInnerHTML={{ __html: katex.renderToString(t.slice(1, -1), { throwOnError: false }) }} />);
    else if (t.startsWith('**')) out.push(<strong key={k++}>{t.slice(2, -2)}</strong>);
    else if (t.startsWith('*')) out.push(<em key={k++}>{t.slice(1, -1)}</em>);
    else out.push(<code key={k++} className="coord">{t}</code>);
    last = m.index + t.length;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}
