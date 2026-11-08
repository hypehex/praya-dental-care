"use client";

import { useState } from "react";
import type { PortalFormOption } from "../_lib/portal-data";

const weekdays = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

function getWeekday(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "";
  const [year, month, day] = date.split("-").map(Number);
  return weekdays[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
}

function availableTimes(schedule?: PortalFormOption) {
  if (!schedule?.startTime || !schedule.endTime) return [];
  const [startHour, startMinute] = schedule.startTime.split(":").map(Number);
  const [endHour, endMinute] = schedule.endTime.split(":").map(Number);
  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;
  const times: string[] = [];

  for (let minutes = start; minutes < end; minutes += 30) {
    times.push(
      `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`,
    );
  }
  return times;
}

export function BookingScheduleFields({
  doctors,
  schedules,
  initialDoctorId,
  initialScheduleId,
  initialDate,
  initialTime,
  scheduleField,
}: {
  doctors?: PortalFormOption[];
  schedules: PortalFormOption[];
  initialDoctorId?: string;
  initialScheduleId?: string;
  initialDate?: string;
  initialTime?: string;
  scheduleField: string;
}) {
  const [doctorId, setDoctorId] = useState(initialDoctorId ?? "");
  const [date, setDate] = useState(initialDate ?? "");
  const [scheduleId, setScheduleId] = useState(initialScheduleId ?? "");
  const [time, setTime] = useState(initialTime ?? "");
  const selectedDoctor = doctors?.find((doctor) => doctor.value === doctorId);
  const doctorIsFixed = !!initialDoctorId;
  const weekday = getWeekday(date);
  const availableSchedules = schedules.filter(
    (schedule) =>
      (!doctors || schedule.doctorId === doctorId) &&
      (!weekday || schedule.day?.toLocaleLowerCase("id") === weekday.toLocaleLowerCase("id")),
  );
  const selectedSchedule = availableSchedules.find(
    (schedule) => schedule.value === scheduleId,
  );
  const times = availableTimes(selectedSchedule);
  const timeOptions =
    time && !times.includes(time) && selectedSchedule
      ? [...times, time].sort()
      : times;

  return (
    <>
      {doctors ? (
        doctorIsFixed ? (
          <input name="Dokter" type="hidden" value={doctorId} />
        ) : (
          <label className="portal-field">
            <span>Dokter</span>
            <select
              aria-label="Dokter"
              name="Dokter"
              onChange={(event) => {
                setDoctorId(event.target.value);
                setScheduleId("");
                setTime("");
              }}
              required
              value={doctorId}
            >
              <option disabled value="">
                Pilih dokter
              </option>
              {doctors.map((doctor) => (
                <option key={doctor.value} value={doctor.value}>
                  {doctor.label}
                </option>
              ))}
            </select>
          </label>
        )
      ) : null}
      {selectedDoctor ? (
        <div className="portal-state-card booking-selected-doctor" aria-live="polite">
          <strong>Dokter yang dipilih</strong>
          <span>{selectedDoctor.label}</span>
        </div>
      ) : null}
      <label className="portal-field">
        <span>Tanggal Kunjungan</span>
        <input
          aria-label="Tanggal Kunjungan"
          name="Tanggal Kunjungan"
          onInput={(event) => {
            setDate(event.currentTarget.value);
            setScheduleId("");
            setTime("");
          }}
          required
          type="date"
          value={date}
        />
      </label>
      <label className="portal-field">
        <span>{scheduleField}</span>
        <select
          aria-label={scheduleField}
          disabled={!doctorId && !!doctors || !weekday}
          name={scheduleField}
          onChange={(event) => {
            setScheduleId(event.target.value);
            setTime("");
          }}
          required
          value={scheduleId}
        >
          <option disabled value="">
            {!weekday
              ? "Pilih tanggal kunjungan terlebih dahulu"
              : !availableSchedules.length
                ? `Tidak ada jadwal praktik pada hari ${weekday}`
                : "Pilih jadwal praktik"}
          </option>
          {availableSchedules.map((schedule) => (
            <option key={schedule.value} value={schedule.value}>
              {schedule.label}
            </option>
          ))}
        </select>
      </label>
      <label className="portal-field">
        <span>Waktu Kunjungan</span>
        <select
          aria-label="Waktu Kunjungan"
          disabled={!selectedSchedule}
          name="Waktu Kunjungan"
          onChange={(event) => setTime(event.target.value)}
          required
          value={time}
        >
          <option disabled value="">
            {selectedSchedule ? "Pilih waktu kunjungan" : "Pilih jadwal praktik terlebih dahulu"}
          </option>
          {timeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
