/**
 * Markdown Renderer - Ant Design Style
 */

"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import { Typography } from "antd";

const { Text, Title, Paragraph } = Typography;

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        components={{
          code(props: any) {
            const { inline, children, ...rest } = props;
            const inlineProp = props.inline ?? false;
            return inlineProp ? (
              <code
                style={{
                  backgroundColor: '#F3F4F6',
                  padding: '2px 6px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontFamily: 'monospace',
                  color: '#EF4444'
                }}
                {...rest}
              >
                {children}
              </code>
            ) : (
              <pre
                style={{
                  backgroundColor: '#F9FAFB',
                  padding: 12,
                  borderRadius: 8,
                  overflow: 'auto',
                  border: '1px solid #E5E7EB',
                  marginTop: 8,
                  marginBottom: 8
                }}
              >
                <code
                  style={{
                    fontSize: 12,
                    fontFamily: 'monospace',
                    color: '#374151'
                  }}
                  {...rest}
                >
                  {children}
                </code>
              </pre>
            );
          },
          ul({ children }) {
            return <ul style={{ paddingLeft: 20, marginTop: 8, marginBottom: 8 }}>{children}</ul>;
          },
          ol({ children }) {
            return <ol style={{ paddingLeft: 20, marginTop: 8, marginBottom: 8 }}>{children}</ol>;
          },
          li({ children }) {
            return <li style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 4 }}>{children}</li>;
          },
          p({ children }) {
            return <p style={{ fontSize: 13, lineHeight: 1.6, marginTop: 8, marginBottom: 8 }}>{children}</p>;
          },
          h1({ children }) {
            return <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 16, marginBottom: 8, borderBottom: '1px solid #E5E7EB', paddingBottom: 8 }}>{children}</h3>;
          },
          h2({ children }) {
            return <h4 style={{ fontSize: 15, fontWeight: 600, marginTop: 12, marginBottom: 6 }}>{children}</h4>;
          },
          h3({ children }) {
            return <h5 style={{ fontSize: 14, fontWeight: 600, marginTop: 10, marginBottom: 6 }}>{children}</h5>;
          },
          strong({ children }) {
            return <strong style={{ fontWeight: 600 }}>{children}</strong>;
          },
          em({ children }) {
            return <em style={{ fontStyle: 'italic' }}>{children}</em>;
          },
          a({ children, href }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#6366F1', textDecoration: 'underline' }}
              >
                {children}
              </a>
            );
          },
          blockquote({ children }) {
            return (
              <blockquote
                style={{
                  borderLeft: '3px solid #6366F1',
                  paddingLeft: 12,
                  marginLeft: 0,
                  marginTop: 8,
                  marginBottom: 8,
                  color: '#6B7280',
                  fontStyle: 'italic'
                }}
              >
                {children}
              </blockquote>
            );
          },
          table({ children }) {
            return (
              <div style={{ overflowX: 'auto', marginTop: 8, marginBottom: 8 }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: 12,
                    border: '1px solid #E5E7EB'
                  }}
                >
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return <thead style={{ backgroundColor: '#F9FAFB' }}>{children}</thead>;
          },
          tbody({ children }) {
            return <tbody>{children}</tbody>;
          },
          tr({ children }) {
            return <tr style={{ borderBottom: '1px solid #E5E7EB' }}>{children}</tr>;
          },
          th({ children }) {
            return (
              <th
                style={{
                  padding: '8px 12px',
                  textAlign: 'left',
                  fontWeight: 600,
                  borderBottom: '2px solid #E5E7EB'
                }}
              >
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td style={{ padding: '8px 12px', borderBottom: '1px solid #F3F4F6' }}>
                {children}
              </td>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
