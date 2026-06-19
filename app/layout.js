const CSS = `
:root {
  --bg: #f5f6f8;
  --card: #ffffff;
  --card2: #f0f2f5;
  --border: #e4e7ec;
  --text: #1a1d27;
  --muted: #667085;
  --accent: #2f6fed;
  --green: #1f9d6b;
  --yellow: #d98a00;
  --red: #e5484d;
  --purple: #6c5ce7;
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}
.wrap { max-width: 1240px; margin: 0 auto; padding: 24px 20px 64px; }
header.top { display: flex; align-items: baseline; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 4px; }
h1 { font-size: 20px; margin: 0; }
.sub { color: var(--muted); font-size: 13px; }
.tabs { display: flex; gap: 8px; margin: 18px 0; }
.tab { padding: 9px 16px; border-radius: 10px; border: 1px solid var(--border); background: var(--card); color: var(--muted); cursor: pointer; font-size: 14px; font-weight: 600; }
.tab.active { background: var(--accent); color: #fff; border-color: var(--accent); }
.filters { display: flex; gap: 12px; flex-wrap: wrap; background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px; margin-bottom: 18px; box-shadow: 0 1px 2px rgba(16,24,40,.04); }
.field { display: flex; flex-direction: column; gap: 4px; }
.field label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; }
.field input, .field select { background: #fff; border: 1px solid var(--border); color: var(--text); border-radius: 8px; padding: 7px 10px; font-size: 13px; min-width: 130px; }
.btn { align-self: flex-end; background: var(--accent); color: #fff; border: none; border-radius: 8px; padding: 8px 16px; font-size: 13px; font-weight: 600; cursor: pointer; }
.btn.ghost { background: var(--card2); color: var(--text); border: 1px solid var(--border); }
.kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 18px; }
.kpi { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 16px; box-shadow: 0 1px 2px rgba(16,24,40,.04); }
.kpi .n { font-size: 28px; font-weight: 700; }
.kpi .l { color: var(--muted); font-size: 12px; margin-top: 2px; }
.kpi.red .n { color: var(--red); }
.kpi.green .n { color: var(--green); }
.kpi.yellow .n { color: var(--yellow); }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.panel { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin-bottom: 16px; box-shadow: 0 1px 2px rgba(16,24,40,.04); }
.panel h3 { margin: 0 0 12px; font-size: 14px; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--border); }
th { color: var(--muted); font-weight: 600; font-size: 11px; text-transform: uppercase; }
a { color: var(--accent); text-decoration: none; }
.pill { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
.pill.todo { background: #eceff3; color: #475467; }
.pill.prog { background: rgba(217,138,0,.14); color: var(--yellow); }
.pill.done { background: rgba(31,157,107,.14); color: var(--green); }
.overdue { color: var(--red); font-weight: 600; }
.loading, .err { padding: 40px; text-align: center; color: var(--muted); }
.err { color: var(--red); }
@media (max-width: 820px) { .kpis { grid-template-columns: repeat(2,1fr); } .grid2 { grid-template-columns: 1fr; } }
`;

export const metadata = {
  title: "Jira Workload Dashboard - GPP Promotion",
  description: "Theo doi workload board Promotion (PT)",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <head>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
