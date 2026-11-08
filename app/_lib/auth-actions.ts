"use server";

import { randomUUID } from "node:crypto";
import { Prisma } from "../generated/prisma/client";
import { redirect } from "next/navigation";
import {
  AuthConfigurationError,
  authenticateRole,
  createSession,
  destroySession,
  hashPasswordForStorage,
  verifyPassword,
  isDatabaseUnavailable,
  type LoginRole,
} from "./auth";
import { prisma } from "./prisma";

function formText(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function makeId(prefix: string) {
  return `${prefix}${randomUUID().replaceAll("-", "").slice(0, 9).toUpperCase()}`;
}

export async function loginAction(role: LoginRole, formData: FormData) {
  const username = formText(formData, "username").trim();
  const password = formText(formData, "password");
  const requestedDestination = formText(formData, "next");
  const destination = role === "pasien" && requestedDestination === "/dashboard/pasien/booking-kunjungan/tambah"
    ? requestedDestination
    : `/dashboard/${role}`;
  const loginPath = destination === requestedDestination
    ? `/masuk/${role}?next=${encodeURIComponent(destination)}`
    : `/masuk/${role}`;
  const loginErrorPath = (error: string) => `${loginPath}${loginPath.includes("?") ? "&" : "?"}error=${error}`;
  if (!username || !password || username.length > 50 || password.length > 255) {
    redirect(loginErrorPath("credentials"));
  }

  let user;
  try {
    user = await authenticateRole(role, username, password);
  } catch (error) {
    if (error instanceof AuthConfigurationError) {
      redirect(loginErrorPath("configuration"));
    }
    if (isDatabaseUnavailable(error)) {
      redirect(loginErrorPath("database"));
    }
    throw error;
  }
  if (!user) redirect(loginErrorPath("credentials"));

  try {
    await createSession(user);
  } catch (error) {
    if (error instanceof AuthConfigurationError) {
      redirect(loginErrorPath("configuration"));
    }
    throw error;
  }

  redirect(destination);
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function registerPatientAction(formData: FormData) {
  const nama = formText(formData, "nama").trim();
  const noHp = formText(formData, "telepon").trim();
  const email = formText(formData, "email").trim().toLowerCase();
  const tanggalLahir = formText(formData, "tanggal-lahir");
  const alamat = formText(formData, "alamat").trim();
  const kodePos = formText(formData, "kode-pos").trim();
  const password = formText(formData, "password");
  const confirmation = formText(formData, "konfirmasi-password");

  const birthDate = new Date(`${tanggalLahir}T00:00:00.000Z`);
  const valid =
    nama.length >= 2 &&
    nama.length <= 100 &&
    noHp.length > 0 &&
    noHp.length <= 15 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    email.length <= 50 &&
    !Number.isNaN(birthDate.getTime()) &&
    /^\d{4}-\d{2}-\d{2}$/.test(tanggalLahir) &&
    birthDate.toISOString().slice(0, 10) === tanggalLahir &&
    birthDate <= new Date(new Date().toISOString().slice(0, 10)) &&
    alamat.length > 0 &&
    alamat.length <= 100 &&
    /^\d{5}$/.test(kodePos) &&
    password.length >= 8 &&
    password.length <= 128 &&
    password === confirmation;
  if (!valid) redirect("/registrasi-pasien/belum-lengkap");

  const storedPassword = await hashPasswordForStorage(password);
  try {
    await prisma.$transaction(async (transaction) => {
      const [existingAccount, postalCode] = await Promise.all([
        transaction.akun_pengguna.findUnique({
          where: { username: email },
          select: { id_akun: true, id_pasien: true, status_akun: true, password: true },
        }),
        transaction.kode_pos.findUnique({
          where: { kode_pos: kodePos },
          select: { kode_pos: true },
        }),
      ]);
      if (!postalCode) throw new Error("POSTAL_CODE_NOT_FOUND");
      if (existingAccount) {
        if (existingAccount.status_akun !== "Perbaikan" || !existingAccount.id_pasien || !(await verifyPassword(password, existingAccount.password))) throw new Error("PATIENT_ACCOUNT_EXISTS");
        await transaction.pasien.update({ where: { id_pasien: existingAccount.id_pasien }, data: { nama_pasien: nama, tanggal_lahir: birthDate, alamat_jalan: alamat, no_hp: noHp, kode_pos: kodePos } });
        await transaction.akun_pengguna.update({ where: { id_akun: existingAccount.id_akun }, data: { status_akun: "Menunggu", tanggal_pengajuan: new Date() } });
        return;
      }
      const matches = await transaction.pasien.findMany({ where: { nama_pasien: { equals: nama, mode: "insensitive" }, tanggal_lahir: birthDate, no_hp: noHp }, select: { id_pasien: true, akun_pengguna: { select: { id_akun: true } } }, take: 2 });
      if (matches.length > 1 || matches[0]?.akun_pengguna.length) throw new Error("PATIENT_ACCOUNT_EXISTS");
      const patientId = matches[0]?.id_pasien ?? makeId("P");
      if (!matches.length) await transaction.pasien.create({
        data: {
          id_pasien: patientId,
          nama_pasien: nama,
          tanggal_lahir: birthDate,
          alamat_jalan: alamat,
          no_hp: noHp,
          kode_pos: postalCode.kode_pos,
          username: email,
          password: storedPassword,
        },
      });
      await transaction.akun_pengguna.create({
        data: {
          id_akun: makeId("A"),
          username: email,
          password: storedPassword,
          status_akun: "Menunggu",
          tanggal_pengajuan: new Date(),
          id_pasien: patientId,
        },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "PATIENT_ACCOUNT_EXISTS") {
      redirect("/registrasi-pasien/akun-sudah-terdaftar");
    }
    if (error instanceof Error && error.message === "POSTAL_CODE_NOT_FOUND") {
      redirect("/registrasi-pasien/belum-lengkap");
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        redirect("/registrasi-pasien/akun-sudah-terdaftar");
      }
      if (error.code === "P2003" || error.code === "P2025") {
        redirect("/registrasi-pasien/belum-lengkap");
      }
    }
    if (isDatabaseUnavailable(error)) {
      redirect("/registrasi-pasien?error=database");
    }
    throw error;
  }

  redirect("/registrasi-pasien/berhasil");
}
