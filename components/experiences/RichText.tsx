import { Fragment, type ReactNode } from "react";

/**
 * Renders the small, safe subset of Markdown that experiences are written in:
 * "## " headings, "- " lists, "---" rules, **bold** and paragraphs.
 * Everything is rendered as React text nodes, so no HTML from a post is ever
 * injected into the page.
 */

function inline(text: string): ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <strong key={i} className="font-semibold text-ink">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

export function RichText({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push(
      <p key={blocks.length} className="mb-5 text-[16px] leading-[1.75] text-strong">
        {inline(paragraph.join(" "))}
      </p>,
    );
    paragraph = [];
  };

  const flushList = () => {
    if (list.length === 0) return;
    blocks.push(
      <ul key={blocks.length} className="mb-6 list-disc space-y-2 pl-6 text-[16px] leading-[1.75] text-strong marker:text-primary-text">
        {list.map((item, i) => (
          <li key={i}>{inline(item)}</li>
        ))}
      </ul>,
    );
    list = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (line === "") {
      flushParagraph();
      flushList();
    } else if (/^#{1,3}\s+/.test(line)) {
      flushParagraph();
      flushList();
      blocks.push(
        <h2
          key={blocks.length}
          className="mb-4 mt-10 shape-cut border border-line bg-tint [--cut:12px] [--r:12px] px-3 py-2 font-display text-[1.3rem] font-semibold leading-snug tracking-[-0.02em] text-ink first:mt-0"
        >
          {line.replace(/^#{1,3}\s+/, "")}
        </h2>,
      );
    } else if (/^[-*]\s+/.test(line)) {
      flushParagraph();
      list.push(line.replace(/^[-*]\s+/, ""));
    } else if (/^-{3,}$/.test(line)) {
      flushParagraph();
      flushList();
      blocks.push(<hr key={blocks.length} className="my-8 border-0 border-t border-dashed border-line" />);
    } else {
      flushList();
      paragraph.push(line);
    }
  }
  flushParagraph();
  flushList();

  return <div className="break-words">{blocks}</div>;
}
