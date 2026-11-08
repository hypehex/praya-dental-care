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
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ role: requestedRole }, { error }] = await Promise.all([
    params,
    searchParams,
  ]);
  const role = loginRoles.find(({ slug }) => slug === requestedRole);

  if (!role) {
    notFound();
  }

  return <RoleLoginPage role={role} error={error} />;
}
