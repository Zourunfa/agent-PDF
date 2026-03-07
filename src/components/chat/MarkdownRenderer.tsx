/**
 * Markdown Renderer Component - 极简艺术风格
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
    <div className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        components={{
          code(props: any) {
            const { node, inline, className, children, ...rest } = props;
            const inlineProp = props.inline ?? false;
            return inlineProp ? (
              <code
                className="rounded-md bg-foreground/5 px-1.5 py-0.5 text-xs font-mono text-foreground/80 before:content-[''] after:content-['']"
                {...rest}
              >
                {children}
              </code>
            ) : (
              <code
                className="block rounded-lg bg-foreground/5 px-3 py-2 text-xs font-mono text-foreground/80 before:content-[''] after:content-[''] overflow-x-auto"
                {...rest}
              >
                {children}
              </code>
            );
          },
          ul({ children }) {
            return <ul className="space-y-1.5">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="space-y-1.5">{children}</ol>;
          },
          li({ children }) {
            return <li className="text-foreground/70 leading-relaxed">{children}</li>;
          },
          p({ children }) {
            return <p className="text-foreground/70 leading-relaxed my-2">{children}</p>;
          },
          h1({ children }) {
            return <h1 className="text-base font-semibold text-foreground/90 my-3">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-sm font-semibold text-foreground/90 my-2.5">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-sm font-medium text-foreground/85 my-2">{children}</h3>;
          },
          strong({ children }) {
            return <strong className="font-semibold text-foreground/90">{children}</strong>;
          },
          em({ children }) {
            return <em className="italic text-foreground/70">{children}</em>;
          },
          a({ children, href }) {
            return (
              <a
                href={href}
                className="text-accent underline underline-offset-2 hover:text-accent/80 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            );
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-2 border-foreground/10 pl-3 italic text-foreground/60 my-2">
                {children}
              </blockquote>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
