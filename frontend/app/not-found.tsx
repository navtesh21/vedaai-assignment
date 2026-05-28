import Link from 'next/link';

export default function NotFound() {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#EEEEEE', gap: 16 }}>
        <div style={{ fontSize: 64 }}>📄</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#303030' }}>Page Not Found</h1>
        <p style={{ color: 'rgba(94,94,94,0.8)', fontSize: 16 }}>The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/" style={{ background: '#272727', color: 'white', padding: '12px 24px', borderRadius: 100, textDecoration: 'none', fontWeight: 500, fontSize: 15 }}>
          Go Home
        </Link>
      </body>
    </html>
  );
}
