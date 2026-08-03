import './globals.css'

export const metadata = {
  title: 'test',
  description: 'Eine ganz simple Next.js-Anwendung',
}

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}
