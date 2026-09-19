import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { requireAuth } from "@/lib/auth";
// add some changes
interface JWTPayload {
  role?: string;
  pages?: string[];
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const url = req.nextUrl.clone();
  const pathname = url.pathname.toLowerCase();

  // ✅ Allow public pages (like login) without token
  if (url.pathname === "/login") {
    return NextResponse.next();
  }

  if (pathname === "/api/users/login") {
    return NextResponse.next();
  }

  // 🔒 Redirect to login if no token is found
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    // 🔐 Validate the token
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    const { role: userRole, pages: userPages } = payload as JWTPayload;

    // ❌ Missing role? Redirect
    if (!userRole) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    if (pathname.startsWith("/api/")) {

        const apiAuth = await requireAuth(req);
        if (!apiAuth.ok) return apiAuth.response;

        if (apiAuth.user.role === "employee") {
          const employeeApiAreas = ["customer", "invoice", "product", "upload"];
          const apiArea = pathname.split("/").filter(Boolean)[1] || "";
          if (!employeeApiAreas.includes(apiArea)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
          }
        }
        return NextResponse.next();
      }

    const pathSegment = pathname.split("/").filter(Boolean)[0] || "";

    // 🏠 Home ("/") as dashboard — only allowed if in `dashboard` pages
    if (pathname === "/") {
      if (userRole === "employee" || !userPages?.includes("dashboard")) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
      return NextResponse.next();
    }

    // 👷 Special rule: employee can only access /pos and /user/profile
    if (userRole === "employee") {
      if (pathSegment !== "pos" && pathname !== "/user/profile") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
      return NextResponse.next();
    }

    // ✅ For other roles: check if user has access to this page
    const isAllowed = userPages?.some(
      (page) => page.toLowerCase() === pathSegment
    ) || (pathSegment === "wholesalers" && userPages?.some((page) =>
      ["purchase", "customer", "invoice"].includes(page.toLowerCase())
    ));
   
    if (!isAllowed) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
    // Debug
    // console.log({
    //   pathname,
    //   pathSegment,
    //   userPages,
    //   isAllowed,
    // });
    return NextResponse.next();
  } catch (err) {
    if (err instanceof Error && err.name !== "JWSSignatureVerificationFailed") {
      console.error("Middleware Error:", err.message);
    }

    const response = pathname.startsWith("/api/")
      ? NextResponse.json({ error: "Invalid session" }, { status: 401 })
      : NextResponse.redirect(new URL("/login", req.url));

    response.cookies.set("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  }
}

export const config = {
  matcher: [
    "/product/:path*",
    "/customer/:path*",
    "/invoice/:path*",
    // "/user/:path*",
    "/dashboard/:path*",
    "/pos/:path*",
    "/utilize/:path*",
    "/purchase/:path*",
    "/wholesalers/:path*",
    // "/user/profile",
    // "/",
    "/api/:path*",
    
  ],
};
