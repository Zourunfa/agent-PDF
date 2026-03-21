/**
 * SearchParamsWrapper - Wrap components using useSearchParams in Suspense
 * This prevents "useSearchParams() should be wrapped in a suspense boundary" errors
 */
'use client';

import { Suspense } from 'react';

export function SearchParamsWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<SearchParamsFallback />}>{children}</Suspense>;
}

function SearchParamsFallback() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
      }}
    >
      <div style={{ textAlign: 'center', color: '#6B7280' }}>加载中...</div>
    </div>
  );
}
