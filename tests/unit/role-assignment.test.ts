// @vitest-environment node
// Who may hand out a role. The database and session are stubbed.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PAID_ROUTES } from "../e2e/paid-routes";

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  granted: vi.fn(),
  change: vi.fn(),
  target: vi.fn(),
  holders: vi.fn(),
  audit: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: mocks.session }));
vi.mock("@/app/api/auth/[...nextauth]/route", () => ({ authOptions: {} }));
vi.mock("@/prisma/client", () => ({
  default: {
    rolePermission: { findMany: mocks.granted },
    user: { findUnique: mocks.target, count: mocks.holders },
    adminAuditLog: { create: mocks.audit },
  },
}));
vi.mock("@/lib/services/permissions", () => ({ changeUserRole: mocks.change }));

import { PUT } from "@/app/api/admin/roles/assign-role-to-user/route";

function request(userId = "someone") {
  return new Request("http://localhost/api/admin/roles/assign-role-to-user", {
    method: "PUT",
    body: JSON.stringify({ userId, roleId: 1 }),
  });
}

function sessionWith(...names: string[]) {
  return { user: { id: "me", role: { name: "Custom" }, permissions: names.map((name) => ({ name })) } };
}

describe("assigning a role", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.change.mockResolvedValue({ id: "someone", role: { name: "Editor" } });
    mocks.target.mockResolvedValue({ roleId: null, username: "someone", role: null });
    mocks.holders.mockResolvedValue(5);
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

  it("refuses changing your own role", async () => {
    mocks.session.mockResolvedValue(sessionWith("users.manage", "roles.manage"));
    mocks.granted.mockResolvedValue([]);
    const response = await PUT(request("me"));
    expect(response.status).toBe(403);
    expect((await response.json()).error).toContain("your own role");
    expect(mocks.change).not.toHaveBeenCalled();
  });

  it("refuses demoting someone with more power than you", async () => {
    mocks.session.mockResolvedValue(sessionWith("users.manage"));
    mocks.target.mockResolvedValue({ roleId: 9, username: "boss", role: { name: "Super Admin" } });
    // The new role grants nothing, and their current one grants more than the actor has.
    mocks.granted.mockImplementation(async ({ where }: { where: { roleId: number } }) =>
      where.roleId === 9 ? [{ permission: { name: "roles.manage" } }] : [],
    );
    const response = await PUT(request());
    expect(response.status).toBe(403);
    expect((await response.json()).error).toContain("permissions you don't");
    expect(mocks.change).not.toHaveBeenCalled();
  });

  it("refuses removing the last person who can manage roles", async () => {
    mocks.session.mockResolvedValue(sessionWith("users.manage", "roles.manage"));
    mocks.target.mockResolvedValue({ roleId: 9, username: "last", role: { name: "Admin" } });
    mocks.granted.mockImplementation(async ({ where }: { where: { roleId: number } }) =>
      where.roleId === 9 ? [{ permission: { name: "roles.manage" } }] : [],
    );
    mocks.holders.mockResolvedValue(0);
    const response = await PUT(request());
    expect(response.status).toBe(403);
    expect((await response.json()).error).toContain("last one");
    expect(mocks.change).not.toHaveBeenCalled();
  });

  it("refuses someone who doesn't exist", async () => {
    mocks.session.mockResolvedValue(sessionWith("users.manage"));
    mocks.target.mockResolvedValue(null);
    expect((await PUT(request())).status).toBe(404);
  });

  it("records the change", async () => {
    mocks.session.mockResolvedValue(sessionWith("users.manage", "roles.manage"));
    mocks.granted.mockResolvedValue([]);
    await PUT(request());
    expect(mocks.audit).toHaveBeenCalledOnce();
    expect(mocks.audit.mock.calls[0][0].data).toMatchObject({ action: "user.role_changed", target: "someone" });
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
