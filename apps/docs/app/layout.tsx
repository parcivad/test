import { RootProvider } from 'fumadocs-ui/provider/next';
import { i18nProvider } from 'fumadocs-ui/i18n';
import './global.css';
import type { Metadata } from 'next';
import { appName, appTagline } from '@/lib/shared';
import { translations } from '@/lib/i18n';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  ),
  title: {
    default: `${appName} — ${appTagline}`,
    template: `%s · ${appName}`,
  },
  description:
    'Hintergrundjobs für Node, die sich wie normaler Code lesen: einreihen, wiederholen, fertig.',
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider i18n={i18nProvider(translations)}>{children}</RootProvider>
      </body>
    </html>
  );
}
