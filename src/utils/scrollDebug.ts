/**
 * Scroll state debugging utility
 */

export function checkScrollState() {
  const html = document.documentElement;
  const body = document.body;
  const nextDiv = document.getElementById('__next');

  const state = {
    hasPageScrollableClass: body.classList.contains('page-scrollable'),
    html: {
      height: html.style.height,
      computedHeight: window.getComputedStyle(html).height,
      overflow: window.getComputedStyle(html).overflow,
    },
    body: {
      height: body.style.height,
      computedHeight: window.getComputedStyle(body).height,
      overflow: window.getComputedStyle(body).overflow,
      overflowY: window.getComputedStyle(body).overflowY,
      maxHeight: body.style.maxHeight,
      computedMaxHeight: window.getComputedStyle(body).maxHeight,
    },
    next: nextDiv ? {
      height: nextDiv.style.height,
      computedHeight: window.getComputedStyle(nextDiv).height,
      maxHeight: nextDiv.style.maxHeight,
      computedMaxHeight: window.getComputedStyle(nextDiv).maxHeight,
    } : null,
  };

  console.group('🔍 Scroll State Check');
  console.log('Has page-scrollable class:', state.hasPageScrollableClass);
  console.log('HTML:', state.html);
  console.log('Body:', state.body);
  console.log('__next:', state.next);

  // Check for issues
  const issues = [];
  if (!state.hasPageScrollableClass) {
    issues.push('❌ Missing page-scrollable class');
  }
  if (state.body.computedHeight === '100vh' || state.body.computedHeight === '100%') {
    issues.push('❌ Body has fixed height');
  }
  if (state.body.computedOverflow === 'hidden') {
    issues.push('❌ Body overflow is hidden');
  }
  if (state.next?.computedHeight === '100vh' || state.next?.computedHeight === '100%') {
    issues.push('❌ __next has fixed height');
  }

  if (issues.length > 0) {
    console.warn('Issues found:', issues);
  } else {
    console.log('✅ All checks passed');
  }

  console.groupEnd();

  return state;
}

// Expose to window for browser console use
if (typeof window !== 'undefined') {
  (window as any).checkScrollState = checkScrollState;
}
