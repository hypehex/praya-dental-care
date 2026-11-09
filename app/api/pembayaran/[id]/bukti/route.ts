import { getSessionPayload, requireRoleSession } from "../../../../_lib/auth";
import { prisma } from "../../../../_lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionPayload();
  if (!session) return Response.json({ error: "Silakan masuk." }, { status: 401 });
  if (!["pasien", "manajer-klinik"].includes(session.role)) return Response.json({ error: "Akses ditolak." }, { status: 403 });
  const identity = await requireRoleSession(session.role);
  const { id } = await params;
  const proof = await prisma.bukti_pembayaran.findFirst({
    where: { id_pembayaran: id, ...(identity.role === "pasien" ? { pembayaran: { id_pasien: identity.profileId } } : {}) },
  });
  if (!proof) return Response.json({ error: "Bukti tidak ditemukan." }, { status: 404 });
  const disposition = new URL(request.url).searchParams.get("preview") === "1" ? "inline" : "attachment";
  return new Response(new Uint8Array(proof.isi_file), {
    headers: {
      "Content-Type": proof.tipe_file,
      "Content-Disposition": `${disposition}; filename*=UTF-8''${encodeURIComponent(proof.nama_file)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
