// API Tests - Auth Routes (Register & Login)

import { hash } from "bcryptjs";
import { NextRequest } from "next/server";
import type { MockedFunction } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Set environment variables BEFORE any imports
process.env.NEXTAUTH_SECRET = "test-secret-for-csrf";
process.env.NEXTAUTH_URL = "http://localhost:3000";

// Mock dependencies
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    student: {
      create: vi.fn(),
    },
    guardian: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  log: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("@/middleware/rate-limit", () => ({
  checkRateLimit: vi.fn(async () => ({ success: true })),
}));

vi.mock("@/lib/security/csrf", () => ({
  csrfMiddleware: vi.fn(async (_req) => ({ valid: true })),
}));

vi.mock("bcryptjs", () => ({
  hash: vi.fn(async (password: string) => `hashed_${password}`),
}));

import { POST as RegisterPOST } from "@/app/api/auth/register/route";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/middleware/rate-limit";

type MockedPrismaUser = typeof prisma.user;
type PrismaUserFindFirstResult = Awaited<
  ReturnType<typeof prisma.user.findFirst>
>;
type PrismaUserCreateResult = Awaited<ReturnType<typeof prisma.user.create>>;

const rateLimitMock = checkRateLimit as unknown as MockedFunction<
  typeof checkRateLimit
>;
const prismaUserFindFirstMock = prisma.user
  .findFirst as unknown as MockedFunction<MockedPrismaUser["findFirst"]>;
const prismaUserCreateMock = prisma.user.create as unknown as MockedFunction<
  MockedPrismaUser["create"]
>;
const prismaStudentCreateMock = prisma.student
  .create as unknown as MockedFunction<typeof prisma.student.create>;

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rateLimitMock.mockResolvedValue({ success: true });
  });

  it("should register student successfully", async () => {
    prismaUserFindFirstMock.mockResolvedValue(
      null as unknown as PrismaUserFindFirstResult,
    );

    prismaUserCreateMock.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      name: "Test Student",
      role: "STUDENT",
    } as unknown as PrismaUserCreateResult);

    prismaStudentCreateMock.mockResolvedValue({
      id: "student-1",
      userId: "user-1",
      grade: 5,
      studentClass: "A",
    });

    const requestBody = {
      name: "Test Student",
      email: "test@example.com",
      password: "Password123!",
      role: "STUDENT",
      grade: 5,
      studentClass: "A",
    };

    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    const response = await RegisterPOST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.userId).toBe("user-1");
    expect(prismaUserCreateMock).toHaveBeenCalled();
  });

  it("should register guardian successfully", async () => {
    prismaUserFindFirstMock.mockResolvedValue(
      null as unknown as PrismaUserFindFirstResult,
    );

    prismaUserCreateMock.mockResolvedValue({
      id: "user-2",
      email: "parent@example.com",
      name: "Test Guardian",
      role: "GUARDIAN",
    } as unknown as PrismaUserCreateResult);

    const requestBody = {
      name: "Test Guardian",
      email: "parent@example.com",
      password: "Password123!",
      role: "GUARDIAN",
    };

    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    const response = await RegisterPOST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(prismaUserCreateMock).toHaveBeenCalled();
  });

  it("should return 400 if user already exists", async () => {
    prismaUserFindFirstMock.mockResolvedValue({
      id: "existing-user",
      email: "existing@example.com",
    } as unknown as PrismaUserFindFirstResult);

    const requestBody = {
      name: "Test User",
      email: "existing@example.com",
      password: "Password123!",
      role: "STUDENT",
      grade: 5,
      studentClass: "A",
    };

    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    const response = await RegisterPOST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Email already in use");
  });

  it("should return 400 for invalid email", async () => {
    const requestBody = {
      name: "Test User",
      email: "invalid-email",
      password: "Password123!",
      role: "STUDENT",
      grade: 5,
      studentClass: "A",
    };

    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    const response = await RegisterPOST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Bad Request");
  });

  it("should return 400 for weak password", async () => {
    const requestBody = {
      name: "Test User",
      email: "test@example.com",
      password: "weak",
      role: "STUDENT",
      grade: 5,
      studentClass: "A",
    };

    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    const response = await RegisterPOST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Bad Request");
  });

  it("should hash password before storing", async () => {
    prismaUserFindFirstMock.mockResolvedValue(
      null as unknown as PrismaUserFindFirstResult,
    );
    prismaUserCreateMock.mockResolvedValue({
      id: "user-1",
    } as unknown as PrismaUserCreateResult);

    const requestBody = {
      name: "Test User",
      email: "test@example.com",
      password: "MySecurePassword123!",
      role: "STUDENT",
      grade: 5,
      studentClass: "A",
    };

    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    await RegisterPOST(request);

    expect(hash).toHaveBeenCalledWith("MySecurePassword123!", 12);
    expect(prismaUserCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          password: "hashed_MySecurePassword123!",
        }),
      }),
    );
  });

  it("should return 429 when rate limit exceeded", async () => {
    rateLimitMock.mockResolvedValue({
      success: false,
      limit: 5,
      remaining: 0,
      reset: Date.now() + 60000,
    });

    const requestBody = {
      name: "Test User",
      email: "test@example.com",
      password: "Password123!",
      role: "STUDENT",
      grade: 5,
      studentClass: "A",
    };

    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    const response = await RegisterPOST(request);

    expect(response.status).toBe(429);
  });

  it("should sanitize input (XSS protection)", async () => {
    prismaUserFindFirstMock.mockResolvedValue(
      null as unknown as PrismaUserFindFirstResult,
    );
    prismaUserCreateMock.mockResolvedValue({
      id: "user-1",
    } as unknown as PrismaUserCreateResult);

    const requestBody = {
      name: "<script>alert('XSS')</script>Test User",
      email: "test@example.com",
      password: "Password123!",
      role: "STUDENT",
      grade: 5,
      studentClass: "A",
    };

    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    await RegisterPOST(request);

    expect(prismaUserCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: expect.not.stringContaining("<script>"),
        }),
      }),
    );
  });

  it("should require grade and class for students", async () => {
    const requestBody = {
      name: "Test Student",
      email: "student@example.com",
      password: "Password123!",
      role: "STUDENT",
      // Missing grade and studentClass
    };

    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    const response = await RegisterPOST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Bad Request");
  });

  it("should not require grade and class for guardians", async () => {
    prismaUserFindFirstMock.mockResolvedValue(
      null as unknown as PrismaUserFindFirstResult,
    );
    prismaUserCreateMock.mockResolvedValue({
      id: "user-1",
      role: "GUARDIAN",
    } as unknown as PrismaUserCreateResult);

    const requestBody = {
      name: "Test Guardian",
      email: "guardian@example.com",
      password: "Password123!",
      role: "GUARDIAN",
      // No grade and studentClass - should be OK
    };

    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    const response = await RegisterPOST(request);

    expect(response.status).toBe(201);
  });
});
