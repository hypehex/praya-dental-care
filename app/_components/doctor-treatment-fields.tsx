"use client";

import { useState } from "react";
import type { PortalFormOption } from "../_lib/portal-data";

export function DoctorTreatmentFields({
  options,
  initialValue,
}: {
  options: PortalFormOption[];
  initialValue?: string;
}) {
  const [selected, setSelected] = useState(initialValue ?? "");
  const isOther = selected === "__other__";

  return (
    <div className="doctor-treatment-fields">
      <label className="portal-field">
        <span>Tindakan</span>
        <select
          aria-label="Tindakan"
          name="Tindakan"
          onChange={(event) => setSelected(event.target.value)}
          required
          value={selected}
        >
          <option disabled value="">Pilih tindakan</option>
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
      {isOther ? (
        <div className="doctor-other-treatment">
          <label className="portal-field">
            <span>Nama Tindakan Lainnya</span>
            <input maxLength={100} name="Tindakan Lainnya" required type="text" />
          </label>
          <label className="portal-field">
            <span>Biaya Tindakan</span>
            <input min="0" name="Biaya Tindakan" required step="0.01" type="number" />
          </label>
          <label className="portal-field doctor-other-description">
            <span>Deskripsi Tindakan</span>
            <textarea maxLength={255} name="Deskripsi Tindakan" required rows={3} />
          </label>
        </div>
      ) : null}
    </div>
  );
}
