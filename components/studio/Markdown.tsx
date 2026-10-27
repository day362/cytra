"use client";

import { memo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const components: Components = {
  a: ({ href, children }) => {
    const external = !!href && /^https?:\/\//.test(href);
    return (
      <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}>
        {children}
      </a>
    );
  },
  table: ({ children }) => (
    <div className="table-wrap" role="region" aria-label="表格" tabIndex={0}>
      <table>{children}</table>
    </div>
  ),
  img: () => null, // Never load remote images from model output.
};

/**
 * Model output is rendered as Markdown without raw HTML (react-markdown's
 * default), so it cannot inject markup or scripts.
 */
export const Markdown = memo(function Markdown({ text }: { text: string }) {
  return (
    <div className="prose-cytra">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components} skipHtml>
        {text}
      </ReactMarkdown>
    </div>
  );
});
