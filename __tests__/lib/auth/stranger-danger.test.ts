// Stranger Danger Protection Tests

import { VerificationStep } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  childApproves,
  initiateLink,
  verifyEmailCodeAndLink,
} from "@/lib/auth/stranger-danger";

// Mock Prisma
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    linkVerification: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    link: {
      create: vi.fn(),
    },
  },
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  log: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Stranger Danger Protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initiateLink", () => {
    it("should create verification with QR_SCANNED status", async () => {
      const { prisma } = await import("@/lib/db/prisma");

      vi.mocked(prisma.linkVerification.create).mockResolvedValue({
        id: "test-id",
        linkCode: "ABC123",
        emailCode: "12345678",
        studentId: "student-1",
        guardianId: "guardian-1",
        step: VerificationStep.QR_SCANNED,
        expiresAt: new Date(),
        createdAt: new Date(),
      });

      const result = await initiateLink("student-1", "guardian-1");

      expect(result.linkCode).toBeDefined();
      expect(result.linkCode.length).toBe(6);
      expect(prisma.linkVerification.create).toHaveBeenCalled();
    });

    it("should set expiration to 15 minutes", async () => {
      const { prisma } = await import("@/lib/db/prisma");

      const mockCreate = vi.fn().mockImplementation((args) => {
        const expiresAt = args.data.expiresAt;
        const now = new Date();
        const diffMinutes = (expiresAt - now) / (1000 * 60);

        expect(diffMinutes).toBeGreaterThanOrEqual(14);
        expect(diffMinutes).toBeLessThanOrEqual(16);

        return {
          id: "test-id",
          linkCode: "ABC123",
          emailCode: "12345678",
          studentId: "student-1",
          guardianId: "guardian-1",
          step: VerificationStep.QR_SCANNED,
          expiresAt,
          createdAt: now,
        };
      });

      vi.mocked(prisma.linkVerification.create).mockImplementation(mockCreate);

      await initiateLink("student-1", "guardian-1");

      expect(mockCreate).toHaveBeenCalled();
    });
  });

  describe("childApproves", () => {
    it("should update step to CHILD_APPROVED", async () => {
      const { prisma } = await import("@/lib/db/prisma");

      vi.mocked(prisma.linkVerification.findUnique).mockResolvedValue({
        id: "test-id",
        linkCode: "ABC123",
        emailCode: "12345678",
        studentId: "student-1",
        guardianId: "guardian-1",
        step: VerificationStep.QR_SCANNED,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        createdAt: new Date(),
      });

      vi.mocked(prisma.linkVerification.update).mockResolvedValue({
        id: "test-id",
        linkCode: "ABC123",
        emailCode: "12345678",
        studentId: "student-1",
        guardianId: "guardian-1",
        step: VerificationStep.CHILD_APPROVED,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        createdAt: new Date(),
      });

      const result = await childApproves("ABC123", "student-1");

      expect(result.success).toBe(true);
      expect(prisma.linkVerification.update).toHaveBeenCalledWith({
        where: { linkCode: "ABC123" },
        data: { step: VerificationStep.CHILD_APPROVED },
      });
    });

    it("should fail if verification not found", async () => {
      const { prisma } = await import("@/lib/db/prisma");
      vi.mocked(prisma.linkVerification.findUnique).mockResolvedValue(null);

      const result = await childApproves("INVALID", "student-1");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Verifikacija nije pronađena");
    });

    it("should fail if expired", async () => {
      const { prisma } = await import("@/lib/db/prisma");

      vi.mocked(prisma.linkVerification.findUnique).mockResolvedValue({
        id: "test-id",
        linkCode: "ABC123",
        emailCode: "12345678",
        studentId: "student-1",
        guardianId: "guardian-1",
        step: VerificationStep.QR_SCANNED,
        expiresAt: new Date(Date.now() - 1000), // Expired
        createdAt: new Date(),
      });

      const result = await childApproves("ABC123", "student-1");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Verifikacija je istekla");
    });

    it("should fail if wrong student", async () => {
      const { prisma } = await import("@/lib/db/prisma");

      vi.mocked(prisma.linkVerification.findUnique).mockResolvedValue({
        id: "test-id",
        linkCode: "ABC123",
        emailCode: "12345678",
        studentId: "student-1",
        guardianId: "guardian-1",
        step: VerificationStep.QR_SCANNED,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        createdAt: new Date(),
      });

      const result = await childApproves("ABC123", "student-2");

      expect(result.success).toBe(false);
      expect(result.error).toBe("ID-evi ne odgovaraju");
    });
  });

  describe("verifyEmailCodeAndLink", () => {
    it("should create link on successful verification", async () => {
      const { prisma } = await import("@/lib/db/prisma");

      vi.mocked(prisma.linkVerification.findUnique).mockResolvedValue({
        id: "test-id",
        linkCode: "ABC123",
        emailCode: "12345678",
        studentId: "student-1",
        guardianId: "guardian-1",
        step: VerificationStep.EMAIL_SENT,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        createdAt: new Date(),
      });

      vi.mocked(prisma.link.create).mockResolvedValue({
        id: "link-id",
        studentId: "student-1",
        guardianId: "guardian-1",
        linkCode: "ABC123",
        isActive: true,
        permissions: null,
        createdAt: new Date(),
        expiresAt: null,
      });

      const result = await verifyEmailCodeAndLink(
        "ABC123",
        "12345678",
        "student-1",
      );

      expect(result.success).toBe(true);
      expect(prisma.link.create).toHaveBeenCalled();
      expect(prisma.linkVerification.delete).toHaveBeenCalled();
    });

    it("should fail with wrong email code", async () => {
      const { prisma } = await import("@/lib/db/prisma");

      vi.mocked(prisma.linkVerification.findUnique).mockResolvedValue({
        id: "test-id",
        linkCode: "ABC123",
        emailCode: "12345678",
        studentId: "student-1",
        guardianId: "guardian-1",
        step: VerificationStep.EMAIL_SENT,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        createdAt: new Date(),
      });

      const result = await verifyEmailCodeAndLink(
        "ABC123",
        "WRONGCODE",
        "student-1",
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "Pogrešan kod! Proveri email i unesi tačan kod.",
      );
    });
  });
});
