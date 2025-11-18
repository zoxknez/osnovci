// Account Lockout Tests
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  isAccountLocked,
  recordLoginAttempt,
  clearLockout,
} from "@/lib/auth/account-lockout";

// Mock Upstash Redis
vi.mock("@/lib/upstash", () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
    del: vi.fn(),
  },
}));

describe("Account Lockout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("isAccountLocked", () => {
    it("should return not locked for new users", async () => {
      const { redis } = await import("@/lib/upstash");
      vi.mocked(redis.get).mockResolvedValue(null);

      const result = await isAccountLocked("test@example.com");

      expect(result.locked).toBe(false);
    });

    it("should return locked after 5 failed attempts", async () => {
      const { redis } = await import("@/lib/upstash");
      vi.mocked(redis.get).mockResolvedValue(
        (Date.now() + 900000).toString(),
      );

      const result = await isAccountLocked("test@example.com");

      expect(result.locked).toBe(true);
      expect(result.message).toContain("zaključan");
    });

    it("should return not locked with 4 attempts", async () => {
      const { redis } = await import("@/lib/upstash");
      vi.mocked(redis.get).mockResolvedValue(null);

      const result = await isAccountLocked("test@example.com");

      expect(result.locked).toBe(false);
    });
  });

  describe("recordLoginAttempt", () => {
    it("should clear attempts on successful login", async () => {
      const { redis } = await import("@/lib/upstash");

      await recordLoginAttempt({
        email: "test@example.com",
        success: true,
      });

      expect(redis.del).toHaveBeenCalledWith("lockout:test@example.com:count");
      expect(redis.del).toHaveBeenCalledWith("lockout:test@example.com:locked");
    });

    it("should increment attempts on failed login", async () => {
      const { redis } = await import("@/lib/upstash");
      vi.mocked(redis.incr).mockResolvedValue(3);

      const result = await recordLoginAttempt({
        email: "test@example.com",
        success: false,
      });

      expect(redis.incr).toHaveBeenCalled();
      expect(result.locked).toBe(false);
      expect(result.attemptsRemaining).toBe(2);
    });

    it("should lock account on 5th failed attempt", async () => {
      const { redis } = await import("@/lib/upstash");
      vi.mocked(redis.incr).mockResolvedValue(5);

      const result = await recordLoginAttempt({
        email: "test@example.com",
        success: false,
      });

      expect(result.locked).toBe(true);
      expect(result.message).toContain("zaključan");
    });
  });

  describe("unlockAccount", () => {
    it("should clear lockout data", async () => {
      const { redis } = await import("@/lib/upstash");
      const { unlockAccount } = await import("@/lib/auth/account-lockout");

      await unlockAccount("test@example.com");

      expect(redis.del).toHaveBeenCalledWith("lockout:test@example.com:count");
      expect(redis.del).toHaveBeenCalledWith("lockout:test@example.com:locked");
    });
  });
});
