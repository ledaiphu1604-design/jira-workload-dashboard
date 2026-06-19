import { NextResponse } from "next/server";

// Bao ve toan bo dashboard bang 1 mat khau chung (HTTP Basic Auth).
// Ca team dung chung 1 link + 1 username/password.
// Neu KHONG set DASHBOARD_PASSWORD -> dashboard mo cong khai (ai co link cung xem).
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export function middleware(req) {
  const USER = process.env.DASHBOARD_USER || "team";
  const PASS = process.env.DASHBOARD_PASSWORD;
  if (!PASS) return NextResponse.next();

  const auth = req.headers.get("authorization");
  if (auth && auth.startsWith("Basic ")) {
    try {
      const decoded = atob(auth.slice(6));
      const idx = decoded.indexOf(":");
      const u = decoded.slice(0, idx);
      const p = decoded.slice(idx + 1);
      if (u === USER && p === PASS) return NextResponse.next();
    } catch (e) {}
  }
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Jira Dashboard"' },
  });
}
