/**
 * Markdown Renderer Component - 深色主题优化
 */

"use client";

import React from "react";
import ReactMarkdown from "react-markdown";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-sm max-w-none prose-invert ${className}`}>
      <ReactMarkdown
        components={{
          code(props: any) {
            const { node, inline, className, children, ...rest } = props;
            const inlineProp = props.inline ?? false;
            return inlineProp ? (
              <code
                className="rounded-md bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 text-xs font-mono text-cyan-300 before:content-[''] after:content-['']"
                {...rest}
              >
                {children}
              </code>
            ) : (
              <code
                className="block rounded-lg bg-slate-900/50 border border-cyan-500/20 px-4 py-3 text-xs font-mono text-cyan-200 before:content-[''] after:content-[''] overflow-x-auto"
                {...rest}
              >
                {children}
              </code>
            );
          },
          ul({ children }) {
            return <ul className="space-y-2 my-3">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="space-y-2 my-3">{children}</ol>;
          },
          li({ children }) {
            return <li className="text-cyan-100/90 leading-relaxed">{children}</li>;
          },
          p({ children }) {
            return <p className="text-cyan-100/90 leading-relaxed my-2">{children}</p>;
          },
          h1({ children }) {
            return <h1 className="text-base font-semibold text-cyan-400 my-3 border-b border-cyan-500/20 pb-2">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-sm font-semibold text-cyan-400 my-2.5">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-sm font-medium text-cyan-400/90 my-2">{children}</h3>;
          },
          strong({ children }) {
            return <strong className="font-semibold text-cyan-300">{children}</strong>;
          },
          em({ children }) {
            return <em className="italic text-cyan-100/80">{children}</em>;
          },
          a({ children, href }) {
            return (
              <a
                href={href}
                className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            );
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-2 border-cyan-500/30 bg-cyan-500/5 pl-4 py-2 italic text-cyan-100/70 my-3 rounded-r">
                {children}
              </blockquote>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-3">
                <table className="min-w-full border border-cyan-500/20 rounded-lg">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="bg-cyan-500/10">{children}</thead>;
          },
          tbody({ children }) {
            return <tbody className="divide-y divide-cyan-500/10">{children}</tbody>;
          },
          tr({ children }) {
            return <tr className="hover:bg-cyan-500/5 transition-colors">{children}</tr>;
          },
          th({ children }) {
            return <th className="px-4 py-2 text-left text-xs font-semibold text-cyan-400 border-b border-cyan-500/20">{children}</th>;
          },
          td({ children }) {
            return <td className="px-4 py-2 text-sm text-cyan-100/80">{children}</td>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
