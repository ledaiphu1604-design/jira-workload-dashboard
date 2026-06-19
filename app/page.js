"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell, CartesianGrid,
} from "recharts";

const COLORS = ["#4c8dff", "#36b37e", "#ffab00", "#ff5630", "#8777d9", "#00b8d9", "#ff8b00", "#6554c0"];

function fmtMonth(d) {
  if (!d) return null;
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
}
function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - 5);
  from.setDate(1);
  const iso = (x) => x.toISOString().slice(0, 10);
  return { from: iso(from), to: iso(to) };
}
function catClass(c) {
  if (c === "Done") return "done";
  if (c === "In Progress") return "prog";
  return "todo";
}
function isOverdue(i) {
  return i.statusCategory !== "Done" && i.duedate && new Date(i.duedate) < new Date();
}

export default function Page() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("team");

  const init = defaultRange();
  const [from, setFrom] = useState(init.from);
  const [to, setTo] = useState(init.to);
  const [fType, setFType] = useState("ALL");
  const [fPriority, setFPriority] = useState("ALL");
  const [fAssignee, setFAssignee] = useState("ALL"); // dung cho view ca nhan

  async function load() {
    setLoading(true); setError(null);
    try {
      const r = await fetch(`/api/jira?from=${from}&to=${to}`);
      const j = await r.json();
      if (j.error) throw new Error(j.error);
      setData(j);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const issues = data?.issues || [];

  // ap dung filter type/priority (dung chung ca 2 view)
  const filtered = useMemo(() => issues.filter((i) =>
    (fType === "ALL" || i.type === fType) &&
    (fPriority === "ALL" || i.priority === fPriority)
  ), [issues, fType, fPriority]);

  const types = useMemo(() => Array.from(new Set(issues.map((i) => i.type))).sort(), [issues]);
  const priorities = useMemo(() => Array.from(new Set(issues.map((i) => i.priority))).sort(), [issues]);
  const assignees = useMemo(() => Array.from(new Set(issues.map((i) => i.assignee))).sort(), [issues]);

  const inRange = (d) => d && d.slice(0, 10) >= from && d.slice(0, 10) <= to;

  if (loading) return <Shell><div className="loading">Dang tai du lieu tu Jira...</div></Shell>;
  if (error) return <Shell><div className="err">Loi: {error}<br/><br/><button className="btn" onClick={load}>Thu lai</button></div></Shell>;

  return (
    <Shell meta={data}>
      <div className="tabs">
        <div className={`tab ${tab === "team" ? "active" : ""}`} onClick={() => setTab("team")}>Team theo thang (high level)</div>
        <div className={`tab ${tab === "person" ? "active" : ""}`} onClick={() => setTab("person")}>Ca nhan (internal review)</div>
      </div>

      <div className="filters">
        <div className="field"><label>Tu ngay</label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div className="field"><label>Den ngay</label><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        <div className="field"><label>Loai issue</label>
          <select value={fType} onChange={(e) => setFType(e.target.value)}>
            <option value="ALL">Tat ca</option>
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="field"><label>Priority</label>
          <select value={fPriority} onChange={(e) => setFPriority(e.target.value)}>
            <option value="ALL">Tat ca</option>
            {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        {tab === "person" && (
          <div className="field"><label>Thanh vien</label>
            <select value={fAssignee} onChange={(e) => setFAssignee(e.target.value)}>
              <option value="ALL">-- Chon nguoi --</option>
              {assignees.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        )}
        <button className="btn" onClick={load}>Ap dung khoang ngay</button>
      </div>

      {tab === "team"
        ? <TeamView issues={filtered} from={from} to={to} inRange={inRange} hasSP={data?.hasStoryPoints} />
        : <PersonView issues={filtered} who={fAssignee} from={from} to={to} inRange={inRange} />}
    </Shell>
  );
}

function Shell({ children, meta }) {
  return (
    <div className="wrap">
      <header className="top">
        <div>
          <h1>Jira Workload Dashboard</h1>
          <div className="sub">
            {meta ? `Project: ${meta.projects.join(", ")} - ${meta.count} issue - cap nhat ${new Date(meta.generatedAt).toLocaleString("vi-VN")}` : "GPP Promotion"}
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}

function Kpi({ n, l, tone }) {
  return <div className={`kpi ${tone || ""}`}><div className="n">{n}</div><div className="l">{l}</div></div>;
}

function TeamView({ issues, from, to, inRange, hasSP }) {
  const createdInRange = issues.filter((i) => inRange(i.created));
  const resolvedInRange = issues.filter((i) => inRange(i.resolutiondate));
  const open = issues.filter((i) => i.statusCategory !== "Done");
  const overdue = open.filter(isOverdue);

  // created vs resolved theo thang
  const months = {};
  createdInRange.forEach((i) => { const m = fmtMonth(i.created); months[m] = months[m] || { month: m, created: 0, resolved: 0 }; months[m].created++; });
  resolvedInRange.forEach((i) => { const m = fmtMonth(i.resolutiondate); months[m] = months[m] || { month: m, created: 0, resolved: 0 }; months[m].resolved++; });
  const monthly = Object.values(months).sort((a, b) => a.month.localeCompare(b.month));

  // open theo assignee
  const byAssignee = {};
  open.forEach((i) => { byAssignee[i.assignee] = byAssignee[i.assignee] || { name: i.assignee, count: 0, sp: 0 }; byAssignee[i.assignee].count++; byAssignee[i.assignee].sp += i.storyPoints || 0; });
  const assigneeData = Object.values(byAssignee).sort((a, b) => b.count - a.count).slice(0, 15);

  // open theo status category
  const byCat = {};
  open.forEach((i) => { byCat[i.statusCategory] = (byCat[i.statusCategory] || 0) + 1; });
  const catData = Object.entries(byCat).map(([name, value]) => ({ name, value }));

  return (
    <>
      <div className="kpis">
        <Kpi n={createdInRange.length} l="Issue tao trong ky" />
        <Kpi n={resolvedInRange.length} l="Issue da resolve trong ky" tone="green" />
        <Kpi n={open.length} l="Dang mo (backlog hien tai)" tone="yellow" />
        <Kpi n={overdue.length} l="Qua han (overdue)" tone="red" />
      </div>

      <div className="panel">
        <h3>Issue tao vs resolve theo thang</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2c3140" />
            <XAxis dataKey="month" stroke="#9aa0ad" fontSize={12} />
            <YAxis stroke="#9aa0ad" fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={{ background: "#1a1d27", border: "1px solid #2c3140", borderRadius: 8 }} />
            <Legend />
            <Bar dataKey="created" name="Tao moi" fill="#4c8dff" radius={[4,4,0,0]} />
            <Bar dataKey="resolved" name="Resolve" fill="#36b37e" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid2">
        <div className="panel">
          <h3>Workload hien tai theo thanh vien (issue dang mo)</h3>
          <ResponsiveContainer width="100%" height={Math.max(260, assigneeData.length * 30)}>
            <BarChart data={assigneeData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2c3140" />
              <XAxis type="number" stroke="#9aa0ad" fontSize={12} allowDecimals={false} />
              <YAxis type="category" dataKey="name" stroke="#9aa0ad" fontSize={11} width={130} />
              <Tooltip contentStyle={{ background: "#1a1d27", border: "1px solid #2c3140", borderRadius: 8 }} />
              <Bar dataKey="count" name="So issue mo" fill="#8777d9" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="panel">
          <h3>Phan bo issue dang mo theo trang thai</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {catData.map((e, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#1a1d27", border: "1px solid #2c3140", borderRadius: 8 }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

function PersonView({ issues, who, inRange }) {
  if (who === "ALL") return <div className="panel"><p style={{ color: "#9aa0ad" }}>Chon 1 thanh vien o filter ben tren de xem chi tiet workload.</p></div>;

  const mine = issues.filter((i) => i.assignee === who);
  const open = mine.filter((i) => i.statusCategory !== "Done");
  const overdue = open.filter(isOverdue);
  const resolved = mine.filter((i) => inRange(i.resolutiondate));
  const createdInRange = mine.filter((i) => inRange(i.created));

  const byStatus = {};
  open.forEach((i) => { byStatus[i.status] = (byStatus[i.status] || 0) + 1; });
  const statusData = Object.entries(byStatus).map(([name, value]) => ({ name, value }));

  const byType = {};
  open.forEach((i) => { byType[i.type] = (byType[i.type] || 0) + 1; });
  const typeData = Object.entries(byType).map(([name, value]) => ({ name, value }));

  const sortedOpen = [...open].sort((a, b) => {
    const ao = isOverdue(a) ? 0 : 1, bo = isOverdue(b) ? 0 : 1;
    if (ao !== bo) return ao - bo;
    return (a.duedate || "9999").localeCompare(b.duedate || "9999");
  });

  return (
    <>
      <div className="kpis">
        <Kpi n={open.length} l="Issue dang phu trach (mo)" tone="yellow" />
        <Kpi n={overdue.length} l="Qua han" tone="red" />
        <Kpi n={resolved.length} l="Resolve trong ky" tone="green" />
        <Kpi n={createdInRange.length} l="Duoc giao trong ky" />
      </div>

      <div className="grid2">
        <div className="panel">
          <h3>Issue dang mo theo trang thai</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2c3140" />
              <XAxis dataKey="name" stroke="#9aa0ad" fontSize={11} />
              <YAxis stroke="#9aa0ad" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#1a1d27", border: "1px solid #2c3140", borderRadius: 8 }} />
              <Bar dataKey="value" name="So issue" fill="#4c8dff" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="panel">
          <h3>Issue dang mo theo loai</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label>
                {typeData.map((e, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#1a1d27", border: "1px solid #2c3140", borderRadius: 8 }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="panel">
        <h3>Danh sach issue dang mo ({sortedOpen.length})</h3>
        <table>
          <thead><tr><th>Key</th><th>Tieu de</th><th>Loai</th><th>Priority</th><th>Trang thai</th><th>Due date</th></tr></thead>
          <tbody>
            {sortedOpen.map((i) => (
              <tr key={i.key}>
                <td><a href={i.url} target="_blank" rel="noreferrer">{i.key}</a></td>
                <td>{i.summary}</td>
                <td>{i.type}</td>
                <td>{i.priority}</td>
                <td><span className={`pill ${catClass(i.statusCategory)}`}>{i.status}</span></td>
                <td className={isOverdue(i) ? "overdue" : ""}>{i.duedate || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
