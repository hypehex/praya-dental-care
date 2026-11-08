"use client";

import { useId, useState } from "react";

export function PatientRegistrationPasswordFields() {
  const id = useId();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const passwordsDoNotMatch =
    confirmation.length > 0 && password !== confirmation;

  return (
    <>
      <div className="registration-password-field">
        <label htmlFor={`${id}-password`}>Kata Sandi</label>
        <div className="registration-password-input">
          <input
            autoComplete="new-password"
            id={`${id}-password`}
            maxLength={128}
            minLength={8}
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Buat kata sandi minimal 8 karakter"
            required
            type={showPassword ? "text" : "password"}
          />
          <button
            aria-label={showPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
            className="registration-password-toggle"
            onClick={() => setShowPassword((visible) => !visible)}
            type="button"
          >
            {showPassword ? "Sembunyikan" : "Lihat"}
          </button>
        </div>
      </div>
      <div className="registration-password-field">
        <label htmlFor={`${id}-confirmation`}>Konfirmasi Kata Sandi</label>
        <div
          className={`registration-password-input${passwordsDoNotMatch ? " is-invalid" : ""}`}
        >
          <input
            aria-describedby={
              passwordsDoNotMatch ? `${id}-password-error` : undefined
            }
            aria-invalid={passwordsDoNotMatch}
            autoComplete="new-password"
            id={`${id}-confirmation`}
            maxLength={128}
            minLength={8}
            name="konfirmasi-password"
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder="Ulangi kata sandi"
            required
            type={showConfirmation ? "text" : "password"}
          />
          <button
            aria-label={
              showConfirmation
                ? "Sembunyikan konfirmasi kata sandi"
                : "Lihat konfirmasi kata sandi"
            }
            className="registration-password-toggle"
            onClick={() => setShowConfirmation((visible) => !visible)}
            type="button"
          >
            {showConfirmation ? "Sembunyikan" : "Lihat"}
          </button>
        </div>
        {passwordsDoNotMatch ? (
          <span
            className="registration-password-error"
            id={`${id}-password-error`}
            role="status"
          >
            Konfirmasi kata sandi belum sama.
          </span>
        ) : null}
      </div>
    </>
  );
}
