import AppLayout from '@/components/AppLayout';

export default function ToolkitPage() {
  return (
    <AppLayout title="AI Teacher's Toolkit" showBack backHref="/">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 16, padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 64 }}>🛠️</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>AI Teacher&apos;s Toolkit</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16, maxWidth: 400 }}>
          Advanced AI tools for teachers — lesson planning, rubric generation, and more. Coming soon!
        </p>
      </div>
    </AppLayout>
  );
}
