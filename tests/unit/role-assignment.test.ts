// @vitest-environment node
// Who may hand out a role. The database and session are stubbed.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PAID_ROUTES } from "../e2e/paid-routes";

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  granted: vi.fn(),
  change: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: mocks.session }));
vi.mock("@/app/api/auth/[...nextauth]/route", () => ({ authOptions: {} }));
vi.mock("@/prisma/client", () => ({
  default: { rolePermission: { findMany: mocks.granted } },
}));
vi.mock("@/lib/services/permissions", () => ({ changeUserRole: mocks.change }));

import { PUT } from "@/app/api/admin/roles/assign-role-to-user/route";

function request() {
  return new Request("http://localhost/api/admin/roles/assign-role-to-user", {
    method: "PUT",
    body: JSON.stringify({ userId: "someone", roleId: 1 }),
  });
}

function sessionWith(...names: string[]) {
  return { user: { id: "me", role: { name: "Custom" }, permissions: names.map((name) => ({ name })) } };
}

describe("assigning a role", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.change.mockResolvedValue({ id: "someone" });
  });

  it("wants a sign-in", async () => {
    mocks.session.mockResolvedValue(null);
    expect((await PUT(request())).status).toBe(401);
    expect(mocks.change).not.toHaveBeenCalled();
  });

  it("refuses someone without the permission, whatever their role is called", async () => {
    mocks.session.mockResolvedValue({ user: { id: "me", role: { name: "Super Admin" }, permissions: [] } });
    expect((await PUT(request())).status).toBe(403);
    expect(mocks.change).not.toHaveBeenCalled();
  });

  it("refuses a role with more power than the person assigning it", async () => {
    mocks.session.mockResolvedValue(sessionWith("users.manage"));
    mocks.granted.mockResolvedValue([
      { permission: { name: "users.manage" } },
      { permission: { name: "roles.manage" } },
    ]);
    const response = await PUT(request());
    expect(response.status).toBe(403);
    expect((await response.json()).error).toContain("permissions you don't have");
    expect(mocks.change).not.toHaveBeenCalled();
  });

  it("allows a role within what they already have", async () => {
    mocks.session.mockResolvedValue(sessionWith("users.manage", "roles.manage"));
    mocks.granted.mockResolvedValue([{ permission: { name: "roles.manage" } }]);
    expect((await PUT(request())).status).toBe(200);
    expect(mocks.change).toHaveBeenCalledOnce();
  });
});

describe("the guard on paid services in browser tests", () => {
  it.each(["/api/civic/bills/ask", "/api/civic/bills/listen", "/api/send-email"])("blocks %s", (url) => {
    expect(PAID_ROUTES.test(`http://localhost:3000${url}`)).toBe(true);
  });

  it("leaves other routes alone", () => {
    expect(PAID_ROUTES.test("http://localhost:3000/api/civic/bills/vote")).toBe(false);
  });
});
