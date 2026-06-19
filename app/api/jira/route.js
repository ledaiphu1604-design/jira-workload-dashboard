// Serverless API route. Chay tren server cua Vercel -> token Jira KHONG bao gio lo ra trinh duyet.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BASE = process.env.JIRA_BASE_URL;
const EMAIL = process.env.JIRA_EMAIL;
const TOKEN = process.env.JIRA_API_TOKEN;
const PROJECTS = (process.env.JIRA_PROJECTS || "PT")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const SP_FIELD = (process.env.JIRA_STORY_POINTS_FIELD || "").trim();

function authHeader() {
  const basic = Buffer.from(`${EMAIL}:${TOKEN}`).toString("base64");
  return `Basic ${basic}`;
}

// Goi endpoint search/jql moi cua Jira Cloud, tu dong phan trang.
async function searchJql(jql, fields, cap = 3000) {
  const all = [];
  let nextPageToken = undefined;
  do {
    const body = {
      jql,
      fields,
      maxResults: 100,
    };
    if (nextPageToken) body.nextPageToken = nextPageToken;

    const res = await fetch(`${BASE}/rest/api/3/search/jql`, {
      method: "POST",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Jira ${res.status}: ${text.slice(0, 300)}`);
    }
    const data = await res.json();
    (data.issues || []).forEach((i) => all.push(i));
    nextPageToken = data.isLast ? undefined : data.nextPageToken;
  } while (nextPageToken && all.length < cap);
  return all;
}

function simplify(issue) {
  const f = issue.fields || {};
  return {
    key: issue.key,
    summary: f.summary || "",
    url: `${BASE}/browse/${issue.key}`,
    assignee: f.assignee ? f.assignee.displayName : "Chua gan (Unassigned)",
    assigneeId: f.assignee ? f.assignee.accountId : null,
    status: f.status ? f.status.name : "",
    statusCategory: f.status?.statusCategory?.name || "",
    type: f.issuetype ? f.issuetype.name : "",
    priority: f.priority ? f.priority.name : "None",
    created: f.created || null,
    updated: f.updated || null,
    resolutiondate: f.resolutiondate || null,
    duedate: f.duedate || null,
    storyPoints: SP_FIELD && typeof f[SP_FIELD] === "number" ? f[SP_FIELD] : 0,
  };
}

export async function GET(request) {
  try {
    if (!BASE || !EMAIL || !TOKEN) {
      return Response.json(
        { error: "Thieu bien moi truong JIRA_BASE_URL / JIRA_EMAIL / JIRA_API_TOKEN" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from"); // YYYY-MM-DD
    const to = searchParams.get("to"); // YYYY-MM-DD

    const projClause = `project in (${PROJECTS.join(",")})`;
    const fields = [
      "summary",
      "status",
      "assignee",
      "issuetype",
      "priority",
      "created",
      "updated",
      "resolutiondate",
      "duedate",
    ];
    if (SP_FIELD) fields.push(SP_FIELD);

    // 1) Issue tao trong khoang thoi gian (throughput / workload theo thang)
    let createdClause = projClause;
    if (from) createdClause += ` AND created >= "${from}"`;
    if (to) createdClause += ` AND created <= "${to} 23:59"`;
    const createdJql = `${createdClause} ORDER BY created DESC`;

    // 2) Issue dang mo (backlog hien tai) - bat ke ngay tao
    const openJql = `${projClause} AND statusCategory != Done ORDER BY priority DESC`;

    const [createdIssues, openIssues] = await Promise.all([
      searchJql(createdJql, fields, 4000),
      searchJql(openJql, fields, 4000),
    ]);

    // Gop unique theo key
    const map = new Map();
    [...createdIssues, ...openIssues].forEach((i) => map.set(i.key, simplify(i)));
    const issues = Array.from(map.values());

    return Response.json({
      generatedAt: new Date().toISOString(),
      projects: PROJECTS,
      hasStoryPoints: Boolean(SP_FIELD),
      count: issues.length,
      issues,
    });
  } catch (err) {
    return Response.json({ error: String(err.message || err) }, { status: 500 });
  }
}
