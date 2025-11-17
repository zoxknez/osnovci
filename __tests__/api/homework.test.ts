// API Tests - Homework Routes

import { NextRequest } from "next/server";
import type { MockedFunction } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Set environment variables BEFORE any imports
process.env.NEXTAUTH_SECRET = "test-secret-for-csrf";

// Mock dependencies
vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    homework: {
      findMany: vi.fn(),
      count: vi.fn(),
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

import { GET, POST } from "@/app/api/homework/route";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/middleware/rate-limit";

type MockSession = {
  user: {
    id: string;
  };
};

type MockStudent = {
  id: string;
  name?: string;
  grade?: number;
  class?: string;
};

type MockHomework = {
  id: string;
  title: string;
  dueDate: Date;
  status: string;
  subject: { name: string };
  attachments: unknown[];
  description?: string;
  priority?: string;
};

const authMock = auth as unknown as MockedFunction<
  () => Promise<MockSession | null>
>;
const rateLimitMock = checkRateLimit as unknown as MockedFunction<
  typeof checkRateLimit
>;
const prismaUserFindUniqueMock = prisma.user
  .findUnique as unknown as MockedFunction<typeof prisma.user.findUnique>;
const prismaHomeworkFindManyMock = prisma.homework
  .findMany as unknown as MockedFunction<typeof prisma.homework.findMany>;
const prismaHomeworkCountMock = prisma.homework
  .count as unknown as MockedFunction<typeof prisma.homework.count>;
const prismaHomeworkCreateMock = prisma.homework
  .create as unknown as MockedFunction<typeof prisma.homework.create>;

type PrismaUserResult = Awaited<ReturnType<typeof prisma.user.findUnique>>;
type PrismaHomeworkListResult = Awaited<
  ReturnType<typeof prisma.homework.findMany>
>;
type PrismaHomeworkCreateResult = Awaited<
  ReturnType<typeof prisma.homework.create>
>;

describe("GET /api/homework", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rateLimitMock.mockResolvedValue({ success: true });
  });

  it("should return 401 if not authenticated", async () => {
    authMock.mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/homework");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return homework list for authenticated student", async () => {
    const mockSession: MockSession = {
      user: { id: "user-1" },
    };

    const mockStudent: MockStudent = {
      id: "student-1",
      name: "Test Student",
      grade: 5,
      class: "A",
    };

    const mockHomework: MockHomework[] = [
      {
        id: "hw-1",
        title: "Math homework",
        dueDate: new Date(),
        status: "ASSIGNED",
        subject: { name: "Math" },
        attachments: [],
      },
    ];

    authMock.mockResolvedValue(mockSession);
    prismaUserFindUniqueMock.mockResolvedValue({
      id: "user-1",
      student: mockStudent,
    } as unknown as PrismaUserResult);
    prismaHomeworkFindManyMock.mockResolvedValue(
      mockHomework as unknown as PrismaHomeworkListResult,
    );
    prismaHomeworkCountMock.mockResolvedValue(1);

    const request = new NextRequest("http://localhost:3000/api/homework");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.homework).toHaveLength(1);
    expect(data.pagination).toBeDefined();
  });

  it("should filter by status", async () => {
    const mockSession: MockSession = {
      user: { id: "user-1" },
    };

    const mockStudent: MockStudent = {
      id: "student-1",
    };

    authMock.mockResolvedValue(mockSession);
    prismaUserFindUniqueMock.mockResolvedValue({
      id: "user-1",
      student: mockStudent,
    } as unknown as PrismaUserResult);
    prismaHomeworkFindManyMock.mockResolvedValue(
      [] as unknown as PrismaHomeworkListResult,
    );
    prismaHomeworkCountMock.mockResolvedValue(0);

    const request = new NextRequest(
      "http://localhost:3000/api/homework?status=DONE",
    );
    await GET(request);

    expect(prismaHomeworkFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "DONE",
        }),
      }),
    );
  });

  it("should support pagination", async () => {
    const mockSession: MockSession = {
      user: { id: "user-1" },
    };

    const mockStudent: MockStudent = {
      id: "student-1",
    };

    authMock.mockResolvedValue(mockSession);
    prismaUserFindUniqueMock.mockResolvedValue({
      id: "user-1",
      student: mockStudent,
    } as unknown as PrismaUserResult);
    prismaHomeworkFindManyMock.mockResolvedValue(
      [] as unknown as PrismaHomeworkListResult,
    );
    prismaHomeworkCountMock.mockResolvedValue(50);

    const request = new NextRequest(
      "http://localhost:3000/api/homework?page=2&limit=20",
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data.pagination.page).toBe(2);
    expect(data.pagination.limit).toBe(20);
    expect(data.pagination.total).toBe(50);
    expect(data.pagination.totalPages).toBe(3);
  });
});

describe("POST /api/homework", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rateLimitMock.mockResolvedValue({ success: true });
  });

  it("should create homework successfully", async () => {
    const mockSession: MockSession = {
      user: { id: "user-1" },
    };

    const mockStudent: MockStudent = {
      id: "student-1",
    };

    const mockHomework: MockHomework = {
      id: "hw-1",
      title: "New homework",
      description: "Test",
      dueDate: new Date(),
      priority: "NORMAL",
      status: "ASSIGNED",
      subject: { name: "Math" },
      attachments: [],
    };

    authMock.mockResolvedValue(mockSession);
    prismaUserFindUniqueMock.mockResolvedValue({
      id: "user-1",
      student: mockStudent,
    } as unknown as PrismaUserResult);
    prismaHomeworkCreateMock.mockResolvedValue(
      mockHomework as unknown as PrismaHomeworkCreateResult,
    );

    const requestBody = {
      subjectId: "subject-1",
      title: "New homework",
      description: "Test description",
      dueDate: new Date().toISOString(),
      priority: "NORMAL",
    };

    const request = new NextRequest("http://localhost:3000/api/homework", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.homework).toBeDefined();
  });

  it("should return 400 for invalid data", async () => {
    const mockSession: MockSession = {
      user: { id: "user-1" },
    };

    const mockStudent: MockStudent = {
      id: "student-1",
    };

    authMock.mockResolvedValue(mockSession);
    prismaUserFindUniqueMock.mockResolvedValue({
      id: "user-1",
      student: mockStudent,
    } as unknown as PrismaUserResult);

    const requestBody = {
      // Missing required fields
      title: "",
    };

    const request = new NextRequest("http://localhost:3000/api/homework", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Bad Request");
  });

  it("should sanitize input (XSS protection)", async () => {
    const mockSession: MockSession = {
      user: { id: "user-1" },
    };

    const mockStudent: MockStudent = {
      id: "student-1",
    };

    authMock.mockResolvedValue(mockSession);
    prismaUserFindUniqueMock.mockResolvedValue({
      id: "user-1",
      student: mockStudent,
    } as unknown as PrismaUserResult);
    prismaHomeworkCreateMock.mockResolvedValue(
      {} as unknown as PrismaHomeworkCreateResult,
    );

    const requestBody = {
      subjectId: "subject-1",
      title: "<script>alert('XSS')</script>Test",
      description: "<img src=x onerror=alert('XSS')>",
      dueDate: new Date().toISOString(),
      priority: "NORMAL",
    };

    const request = new NextRequest("http://localhost:3000/api/homework", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    await POST(request);

    expect(prismaHomeworkCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({
          title: expect.stringContaining("<script>"),
        }),
      }),
    );
  });
});
