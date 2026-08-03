import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
            className="text-fd-primary"
          >
            <path
              d="M4 15.5c2.2-5.5 5-8.5 8-8.5s4.5 2 4.5 4-1.4 3.5-3 3.5-2.5-1-2.5-2.2c0-1 .6-1.8 1.4-1.8"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
            <circle cx="18.5" cy="6.5" r="1.8" fill="currentColor" />
          </svg>
          <span className="font-semibold">{appName}</span>
        </>
      ),
    },
    links: [
      {
        text: 'Dokumentation',
        url: '/docs',
        active: 'nested-url',
      },
      {
        text: 'Schnellstart',
        url: '/docs/erste-schritte/schnellstart',
        active: 'nested-url',
      },
      {
        text: 'CLI',
        url: '/docs/referenz/cli',
        active: 'nested-url',
      },
    ],
  };
}
