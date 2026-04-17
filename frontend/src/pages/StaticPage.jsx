import React, { useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { STATIC_PAGES } from '../data/staticPages.js';

export default function StaticPage() {
  const { slug } = useParams();
  const pageData = STATIC_PAGES[slug];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!pageData) {
    return <Navigate to="/" replace />;
  }

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <nav style={{ background: '#0F172A', padding: '16px 32px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, background: '#4F46E5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={16} color="white" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>Work<span style={{ color: '#818CF8' }}>Safe</span></span>
          </Link>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94A3B8', fontSize: 14, fontWeight: 600, textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'white'}
            onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}>
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main style={{ flex: 1, padding: '60px 24px' }}>
        <style>{`
          @media (max-width: 640px) {
            .static-content-box { padding: 32px 24px !important; }
            .static-title { font-size: 28px !important; }
          }
        `}</style>
        <div className="static-content-box" style={{ maxWidth: 680, margin: '0 auto', background: 'white', borderRadius: 16, padding: '48px', boxShadow: '0 4px 24px rgba(0,0,0,0.04)', border: '1px solid #E2E8F0' }}>
          <div style={{ marginBottom: 40, paddingBottom: 24, borderBottom: '1px solid #F1F5F9' }}>
            {pageData.subtitle && <div style={{ fontSize: 13, fontWeight: 700, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>{pageData.subtitle}</div>}
            <h1 className="static-title" style={{ fontSize: 36, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px' }}>{pageData.title}</h1>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {pageData.content.map((block, idx) => {
              if (block.type === 'h2') {
                return <h2 key={idx} style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginTop: 16 }}>{block.text}</h2>;
              }
              if (block.type === 'p') {
                return <p key={idx} style={{ fontSize: 15, color: '#475569', lineHeight: 1.8 }}>{block.text}</p>;
              }
              if (block.type === 'ul') {
                return (
                  <ul key={idx} style={{ paddingLeft: 24, margin: '8px 0', fontSize: 15, color: '#475569', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {block.items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                );
              }
              return null;
            })}
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer style={{ background: '#0F172A', padding: '32px', textAlign: 'center', color: '#64748B', fontSize: 13 }}>
        © 2026 WorkSafe · Built at DEVTrails
      </footer>
    </div>
  );
}
