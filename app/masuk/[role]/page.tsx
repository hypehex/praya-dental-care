import { notFound } from "next/navigation";
import {
  loginRoles,
  RoleLoginPage,
} from "../../_components/role-login-page";

export const instant = false;

export function generateStaticParams() {
  return loginRoles.map(({ slug }) => ({ role: slug }));
}

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ role: string }>;
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const [{ role: requestedRole }, { error, next }] = await Promise.all([
    params,
    searchParams,
  ]);
  const role = loginRoles.find(({ slug }) => slug === requestedRole);

  if (!role) {
    notFound();
  }

  const safeNext = requestedRole === "pasien" && next === "/dashboard/pasien/booking-kunjungan/tambah"
    ? next
    : undefined;
  return <RoleLoginPage role={role} error={error} next={safeNext} />;
}
