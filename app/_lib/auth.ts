import "server-only";
import {
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Prisma } from "../generated/prisma/client";
import type { PortalRoleSlug } from "./portal-config";
import { prisma } from "./prisma";

const SESSION_COOKIE = "praya_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;
const SCRYPT_KEY_LENGTH = 64;

export type LoginRole = PortalRoleSlug;

export type UserSession = {
  subjectId: string;
  profileId: string;
  role: LoginRole;
  displayName: string;
};

type SessionPayload = {
  sub: string;
  profile: string;
  role: LoginRole;
  exp: number;
};

type AuthenticatedUser = {
  subjectId: string;
  role: LoginRole;
  displayName: string;
  profileId?: string;
};

export class AuthConfigurationError extends Error {
  constructor() {
    super("AUTH_SECRET must contain at least 32 characters.");
    this.name = "AuthConfigurationError";
  }
}

function getSessionSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new AuthConfigurationError();
  }
  return secret;
}

export function isDatabaseUnavailable(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P1001" || error.code === "P1002" || error.code === "P1017";
  }

  if (!(error instanceof Error)) return false;
  return /timeout expired|connection refused|can't reach database server|server has closed the connection/i.test(
    error.message,
  );
}

function isLegacyPassword(password: string) {
  return !password.startsWith("$scrypt$");
}

async function derivePasswordKey(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(
      password,
      salt,
      SCRYPT_KEY_LENGTH,
      { N: 1 << 15, maxmem: 64 * 1024 * 1024 },
      (error, key) => {
        if (error) reject(error);
        else resolve(key);
      },
    );
  });
}

export async function hashPasswordForStorage(password: string) {
  const salt = randomBytes(16);
  const key = await derivePasswordKey(password, salt);
  return `$scrypt$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

export async function verifyPassword(password: string, stored: string) {
  if (isLegacyPassword(stored)) {
    const storedBytes = Buffer.alloc(255);
    const suppliedBytes = Buffer.alloc(255);
    const storedLength = Buffer.byteLength(stored);
    const suppliedLength = Buffer.byteLength(password);
    if (storedLength > storedBytes.length || suppliedLength > suppliedBytes.length) {
      return false;
    }
    storedBytes.write(stored);
    suppliedBytes.write(password);
    return timingSafeEqual(storedBytes, suppliedBytes) && storedLength === suppliedLength;
  }

  const [, algorithm, saltValue, keyValue] = stored.split("$");
  if (algorithm !== "scrypt" || !saltValue || !keyValue) return false;

  const salt = Buffer.from(saltValue, "base64url");
  const expectedKey = Buffer.from(keyValue, "base64url");
  if (salt.length !== 16 || expectedKey.length !== SCRYPT_KEY_LENGTH) return false;

  const actualKey = await derivePasswordKey(password, salt);
  return timingSafeEqual(actualKey, expectedKey);
}

function getRoleFromAccount(account: {
  id_owner: string | null;
  id_manajer: string | null;
  id_pasien: string | null;
  id_dokter: string | null;
}) {
  const roles: { role: LoginRole; profileId: string }[] = [];
  if (account.id_owner) roles.push({ role: "owner", profileId: account.id_owner });
  if (account.id_manajer) roles.push({ role: "manajer-klinik", profileId: account.id_manajer });
  if (account.id_pasien) roles.push({ role: "pasien", profileId: account.id_pasien });
  if (account.id_dokter) roles.push({ role: "dokter", profileId: account.id_dokter });
  return roles.length === 1 ? roles[0] : null;
}

async function updateLegacyPassword(user: AuthenticatedUser, oldPassword: string, newPassword: string) {
  await prisma.$transaction(async (transaction) => {
    if (user.role === "perawat") {
      await transaction.perawat.updateMany({
        where: { id_perawat: user.subjectId, password: oldPassword },
        data: { password: newPassword },
      });
      return;
    }

    await transaction.akun_pengguna.updateMany({
      where: { id_akun: user.subjectId, password: oldPassword },
      data: { password: newPassword },
    });

    if (!user.profileId) return;
    if (user.role === "owner") {
      await transaction.owner.updateMany({
        where: { id_owner: user.profileId, password: oldPassword },
        data: { password: newPassword },
      });
    } else if (user.role === "manajer-klinik") {
      await transaction.manajer_klinik.updateMany({
        where: { id_manajer: user.profileId, password: oldPassword },
        data: { password: newPassword },
      });
    } else if (user.role === "pasien") {
      await transaction.pasien.updateMany({
        where: { id_pasien: user.profileId, password: oldPassword },
        data: { password: newPassword },
      });
    }
  });
}

export async function authenticateRole(
  role: LoginRole,
  username: string,
  password: string,
): Promise<UserSession | null> {
  if (role === "perawat") {
    const candidates = await prisma.perawat.findMany({
      where: { username },
      select: {
        id_perawat: true,
        nama_perawat: true,
        password: true,
      },
      take: 2,
    });
    if (candidates.length !== 1) return null;

    const nurse = candidates[0];
    if (!(await verifyPassword(password, nurse.password))) return null;

    const user: AuthenticatedUser = {
      subjectId: nurse.id_perawat,
      role,
      displayName: nurse.nama_perawat,
    };
    if (isLegacyPassword(nurse.password)) {
      const newPassword = await hashPasswordForStorage(password);
      await updateLegacyPassword(user, nurse.password, newPassword);
    }
    return {
      subjectId: user.subjectId,
      profileId: user.subjectId,
      role,
      displayName: user.displayName,
    };
  }

  const account = await prisma.akun_pengguna.findUnique({
    where: { username },
    select: {
      id_akun: true,
      password: true,
      status_akun: true,
      id_owner: true,
      id_manajer: true,
      id_pasien: true,
      id_dokter: true,
      owner: { select: { nama_owner: true } },
      manajer_klinik: { select: { nama: true } },
      pasien: { select: { nama_pasien: true } },
      dokter: { select: { nama: true } },
    },
  });
  if (!account || account.status_akun.trim().toLocaleLowerCase("id") !== "aktif") {
    return null;
  }

  const accountRole = getRoleFromAccount(account);
  if (!accountRole || accountRole.role !== role) return null;
  if (!(await verifyPassword(password, account.password))) return null;

  const displayName =
    account.owner?.nama_owner ??
    account.manajer_klinik?.nama ??
    account.pasien?.nama_pasien ??
    account.dokter?.nama;
  if (!displayName) return null;

  const user: AuthenticatedUser = {
    subjectId: account.id_akun,
    profileId: accountRole.profileId,
    role,
    displayName,
  };
  if (isLegacyPassword(account.password)) {
    const newPassword = await hashPasswordForStorage(password);
    await updateLegacyPassword(user, account.password, newPassword);
  }

  return {
    subjectId: user.subjectId,
    profileId: accountRole.profileId,
    role,
    displayName,
  };
}

export async function createSession(user: Pick<UserSession, "subjectId" | "profileId" | "role">) {
  const secret = getSessionSecret();
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const payload: SessionPayload = {
    sub: user.subjectId,
    profile: user.profileId,
    role: user.role,
    exp: expiresAt,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, `${encodedPayload}.${signature}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionPayload(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const [encodedPayload, signature, extra] = token.split(".");
  if (!encodedPayload || !signature || extra) return null;

  let expectedSignature: Buffer;
  try {
    expectedSignature = createHmac("sha256", getSessionSecret())
      .update(encodedPayload)
      .digest();
  } catch (error) {
    if (error instanceof AuthConfigurationError) return null;
    throw error;
  }

  const suppliedSignature = Buffer.from(signature, "base64url");
  if (
    suppliedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(suppliedSignature, expectedSignature)
  ) {
    return null;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!payload || typeof payload !== "object") return null;

  const candidate = payload as Partial<SessionPayload>;
  if (
    typeof candidate.sub !== "string" ||
    typeof candidate.profile !== "string" ||
    typeof candidate.exp !== "number" ||
    candidate.exp <= Math.floor(Date.now() / 1000) ||
    !["manajer-klinik", "dokter", "perawat", "owner", "pasien"].includes(
      candidate.role ?? "",
    )
  ) {
    return null;
  }

  return candidate as SessionPayload;
}

export async function requireRoleSession(expectedRole: LoginRole): Promise<UserSession> {
  const session = await getSessionPayload();
  if (!session) redirect(`/masuk/${expectedRole}`);
  if (session.role !== expectedRole) redirect(`/dashboard/${session.role}`);

  if (expectedRole === "perawat") {
    const nurse = await prisma.perawat.findUnique({
      where: { id_perawat: session.sub },
      select: { id_perawat: true, nama_perawat: true },
    });
    if (!nurse) redirect(`/masuk/${expectedRole}?error=inactive`);
    return {
      subjectId: nurse.id_perawat,
      profileId: nurse.id_perawat,
      role: expectedRole,
      displayName: nurse.nama_perawat,
    };
  }

  const account = await prisma.akun_pengguna.findUnique({
    where: { id_akun: session.sub },
    select: {
      id_akun: true,
      status_akun: true,
      id_owner: true,
      id_manajer: true,
      id_pasien: true,
      id_dokter: true,
      owner: { select: { nama_owner: true } },
      manajer_klinik: { select: { nama: true } },
      pasien: { select: { nama_pasien: true } },
      dokter: { select: { nama: true } },
    },
  });
  const accountRole = account && getRoleFromAccount(account);
  if (
    !account ||
    account.status_akun.trim().toLocaleLowerCase("id") !== "aktif" ||
    accountRole?.role !== expectedRole
  ) {
    redirect(`/masuk/${expectedRole}?error=inactive`);
  }

  const displayName =
    account.owner?.nama_owner ??
    account.manajer_klinik?.nama ??
    account.pasien?.nama_pasien ??
    account.dokter?.nama;
  if (!displayName) {
    redirect(`/masuk/${expectedRole}?error=inactive`);
  }

  return {
    subjectId: account.id_akun,
    profileId: accountRole.profileId,
    role: expectedRole,
    displayName,
  };
}
