import { validDate } from "../../../_lib/workflow";
import { notFound, redirect } from "next/navigation";
import { RoleDashboard } from "../../../_components/role-dashboard";
import {
  getPortalRole,
  getPortalScreen,
  portalRoles,
} from "../../../_lib/portal-config";
import { isDatabaseUnavailable, requireRoleSession } from "../../../_lib/auth";
import {
  loadPortalFormOptions,
  loadPortalRows,
  type PortalFormOption,
  type PortalRow,
} from "../../../_lib/portal-data";
import type { UserSession } from "../../../_lib/auth";

export const instant = false;

export function generateStaticParams() {
  return portalRoles.flatMap((role) => [
    { role: role.slug },
    ...role.screens
      .filter((screen) => screen.section !== "")
      .map((screen) => ({
        role: role.slug,
        section: screen.section.split("/"),
      })),
  ]);
}

export default async function PortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ role: string; section?: string[] }>;
  searchParams: Promise<{ id?: string; error?: string; q?: string; from?: string; to?: string; category?: string }>;
}) {
  const [{ role: roleSlug, section = [] }, { id: recordIdParam, error, q, from, to, category }] =
    await Promise.all([params, searchParams]);
  const role = getPortalRole(roleSlug);
  if (!role) notFound();

  const screen = getPortalScreen(role, section.join("/"));
  if (!screen) notFound();
  const recordId = typeof recordIdParam === "string" && recordIdParam.length <= 10
    ? recordIdParam
    : undefined;

  let identity: UserSession;
  try {
    identity = await requireRoleSession(role.slug);
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      redirect(`/masuk/${role.slug}?error=database`);
    }
    throw error;
  }

  let rows: PortalRow[] = [];
  let formOptions: Record<string, PortalFormOption[]> = {};
  let dataError: string | undefined;
  try {
    const filters = { from: typeof from === "string" && validDate(from) ? from : undefined, to: typeof to === "string" && validDate(to) ? to : undefined, category: typeof category === "string" ? category : undefined };
    if ((from && !filters.from) || (to && !filters.to) || (filters.from && filters.to && filters.from > filters.to)) {
      dataError = "Periode tidak valid. Periksa tanggal awal dan tanggal akhir.";
    } else {
      rows = await loadPortalRows(role, screen, identity, recordId, filters);
      if (typeof q === "string" && q.trim()) rows = rows.filter((row) => row.cells.some((cell) => cell.toLocaleLowerCase("id").includes(q.trim().toLocaleLowerCase("id"))));
    }
    if (screen.kind === "form") {
      formOptions = await loadPortalFormOptions(role, screen, identity, recordId);
    }
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error;
    dataError = "Data tidak dapat dimuat karena koneksi database tidak tersedia.";
  }

  return (
    <RoleDashboard
      role={role}
      screen={screen}
      identity={identity}
      rows={rows}
      dataError={dataError}
      formOptions={formOptions}
      recordId={recordId}
      error={error}
    />
  );
}
