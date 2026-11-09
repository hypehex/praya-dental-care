"use client";

import { useState } from "react";
import type { PortalFormOption } from "../_lib/portal-data";

const transitions: Record<string, string[]> = {
  Menunggu: ["Pemeriksaan"],
  Dikonfirmasi: ["Pemeriksaan"],
  Pemeriksaan: ["Selesai"],
};

export function NurseStatusFields({ visits }: { visits: PortalFormOption[] }) {
  const [visitId, setVisitId] = useState("");
  const visit = visits.find((option) => option.value === visitId);
  const statuses = transitions[visit?.currentStatus ?? ""] ?? [];

  return (
    <div className="nurse-status-fields">
      <label className="portal-field nurse-visit-selector">
        <span>Kunjungan</span>
        <select name="visitId" onChange={(event) => setVisitId(event.target.value)} required value={visitId}>
          <option disabled value="">Pilih kunjungan pasien</option>
          {visits.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
      <input name="Status Saat Ini" type="hidden" value={visit?.currentStatus ?? ""} />
      <div className="nurse-visit-context">
        <div><span>Nama Pasien</span><strong>{visit?.patient ?? "Pilih kunjungan terlebih dahulu"}</strong></div>
        <div><span>Nomor Rekam Medis</span><strong>{visit?.medicalRecord ?? "-"}</strong></div>
        <div><span>Layanan</span><strong>{visit?.service ?? "-"}</strong></div>
        <div><span>Status Saat Ini</span><strong>{visit?.currentStatus ?? "-"}</strong></div>
      </div>
      <label className="portal-field nurse-next-status">
        <span>Status Baru</span>
        <select disabled={!visit} name="Status Baru" required>
          <option value="">Pilih status berikutnya</option>
          {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
      </label>
      <p className="nurse-status-note">Sistem memeriksa urutan status sebelum menyimpan.</p>
    </div>
  );
}
