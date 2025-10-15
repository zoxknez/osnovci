// API Tests - Homework Routes
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/homework/route";

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
  rateLimit: () => (handler: any) => handler,
}));

import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

describe("GET /api/homework", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/homework");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return homework list for authenticated student", async () => {
    const mockSession = {
      user: { id: "user-1" },
    };

    const mockStudent = {
      id: "student-1",
      name: "Test Student",
      grade: 5,
      class: "A",
    };

    const mockHomework = [
      {
        id: "hw-1",
        title: "Math homework",
        dueDate: new Date(),
        status: "ASSIGNED",
        subject: { name: "Math" },
        attachments: [],
      },
    ];

    vi.mocked(auth).mockResolvedValue(mockSession);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      student: mockStudent,
    } as any);
    vi.mocked(prisma.homework.findMany).mockResolvedValue(mockHomework as any);
    vi.mocked(prisma.homework.count).mockResolvedValue(1);

    const request = new NextRequest("http://localhost:3000/api/homework");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.homework).toHaveLength(1);
    expect(data.pagination).toBeDefined();
  });

  it("should filter by status", async () => {
    const mockSession = {
      user: { id: "user-1" },
    };

    const mockStudent = {
      id: "student-1",
    };

    vi.mocked(auth).mockResolvedValue(mockSession);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      student: mockStudent,
    } as any);
    vi.mocked(prisma.homework.findMany).mockResolvedValue([]);
    vi.mocked(prisma.homework.count).mockResolvedValue(0);

    const request = new NextRequest(
      "http://localhost:3000/api/homework?status=DONE",
    );
    const response = await GET(request);

    expect(vi.mocked(prisma.homework.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "DONE",
        }),
      }),
    );
  });

  it("should support pagination", async () => {
    const mockSession = {
      user: { id: "user-1" },
    };

    const mockStudent = {
      id: "student-1",
    };

    vi.mocked(auth).mockResolvedValue(mockSession);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      student: mockStudent,
    } as any);
    vi.mocked(prisma.homework.findMany).mockResolvedValue([]);
    vi.mocked(prisma.homework.count).mockResolvedValue(50);

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
  });

  it("should create homework successfully", async () => {
    const mockSession = {
      user: { id: "user-1" },
    };

    const mockStudent = {
      id: "student-1",
    };

    const mockHomework = {
      id: "hw-1",
      title: "New homework",
      description: "Test",
      dueDate: new Date(),
      priority: "NORMAL",
      status: "ASSIGNED",
      subject: { name: "Math" },
      attachments: [],
    };

    vi.mocked(auth).mockResolvedValue(mockSession);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      student: mockStudent,
    } as any);
    vi.mocked(prisma.homework.create).mockResolvedValue(mockHomework as any);

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
    const mockSession = {
      user: { id: "user-1" },
    };

    const mockStudent = {
      id: "student-1",
    };

    vi.mocked(auth).mockResolvedValue(mockSession);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      student: mockStudent,
    } as any);

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
    const mockSession = {
      user: { id: "user-1" },
    };

    const mockStudent = {
      id: "student-1",
    };

    vi.mocked(auth).mockResolvedValue(mockSession);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      student: mockStudent,
    } as any);
    vi.mocked(prisma.homework.create).mockResolvedValue({} as any);

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

    // Check that create was called with sanitized data
    expect(vi.mocked(prisma.homework.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({
          title: expect.stringContaining("<script>"),
        }),
      }),
    );
  });
});

