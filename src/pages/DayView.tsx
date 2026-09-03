import { AnimatePresence, motion } from "framer-motion";
import type { Appointment, Settings } from "../types";
import { AppointmentBlock } from "../components/AppointmentBlock";
import { WeekStrip } from "../components/WeekStrip";
import logo from "../assets/logo.png";
import {
  addDays,
  buildHourSlots,
  formatDayLabel,
  formatTime12,
  getNextAppointment,
  minutesToTime,
  timeToMinutes,
  toDateKey,
} from "../lib/time";

const PX_PER_MINUTE = 1.35;

interface Props {
  selectedDate: Date;
  settings: Settings;
  appointments: Appointment[];
  onSelectDate: (date: Date) => void;
  onSelectAppointment: (appointment: Appointment) => void;
  onMarkDone: (appointment: Appointment) => void;
  onCancelAppointment: (appointment: Appointment) => void;
  onDeleteAppointment: (appointment: Appointment) => void;
  onAdd: () => void;
  onOpenSettings: () => void;
  flashId?: string | null;
}

export function DayView({
  selectedDate,
  settings,
  appointments,
  onSelectDate,
  onSelectAppointment,
  onMarkDone,
  onCancelAppointment,
  onDeleteAppointment,
  onAdd,
  onOpenSettings,
  flashId,
}: Props) {
  const dateKey = toDateKey(selectedDate);
  const dayAppointments = appointments
    .filter((a) => a.date === dateKey && a.status !== "cancelled")
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  const openMinutes = timeToMinutes(settings.openTime);
  const closeMinutes = timeToMinutes(settings.closeTime);
  const hours = buildHourSlots(settings.openTime, settings.closeTime);
  const gridHeight = Math.max(
    (closeMinutes - openMinutes) * PX_PER_MINUTE,
    200,
  );
  const next = getNextAppointment(appointments, dateKey);
  const isClosed = !settings.openDays.includes(selectedDate.getDay());

  return (
    <div className="day-view">
      <header className="hero">
        <div className="hero__top">
          <motion.div
            className="brand-lockup"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <img
              src={logo}
              alt={settings.shopName}
              className="brand-logo"
            />
            <div className="brand-copy">
              <p className="brand">{settings.shopName}</p>
              <p className="brand-script">Barbershop</p>
              <p className="brand-est">Est. 2006</p>
            </div>
          </motion.div>
          <button
            type="button"
            className="icon-btn"
            onClick={onOpenSettings}
            aria-label="Settings"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="M19.4 13a7.8 7.8 0 0 0 .05-2l2.05-1.55-2-3.46-2.45.95a7.7 7.7 0 0 0-1.73-1L15 3h-4l-.32 2.94a7.7 7.7 0 0 0-1.73 1L6.5 5.99l-2 3.46L6.55 11a7.8 7.8 0 0 0 0 2l-2.05 1.55 2 3.46 2.45-.95a7.7 7.7 0 0 0 1.73 1L11 21h4l.32-2.94a7.7 7.7 0 0 0 1.73-1l2.45.95 2-3.46L19.4 13Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="roundel-rule" aria-hidden="true" />

        <motion.h1
          className="hero__date"
          key={dateKey}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          {formatDayLabel(selectedDate)}
        </motion.h1>

        <motion.p
          className="hero__next"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          {isClosed
            ? "Shop is closed this day"
            : next
              ? `Next up: ${next.clientName} at ${formatTime12(next.startTime)}`
              : dayAppointments.length === 0
                ? "No appointments yet — book the first one"
                : "All clear for the rest of the day"}
        </motion.p>

        <div className="hero__nav">
          <button
            type="button"
            className="ghost-btn"
            onClick={() => onSelectDate(addDays(selectedDate, -7))}
          >
            Prev week
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => onSelectDate(new Date())}
          >
            Today
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => onSelectDate(addDays(selectedDate, 7))}
          >
            Next week
          </button>
        </div>
      </header>

      <WeekStrip
        selected={selectedDate}
        openDays={settings.openDays}
        onSelect={onSelectDate}
      />

      <section className="calendar" aria-label="Day schedule">
        {dayAppointments.length === 0 && !isClosed && (
          <motion.div
            className="empty-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p>Free chair</p>
            <span>Tap below to add a booking</span>
          </motion.div>
        )}

        <div className="calendar__grid" style={{ height: gridHeight }}>
          {hours.map((hour) => {
            const top = (hour * 60 - openMinutes) * PX_PER_MINUTE;
            return (
              <div key={hour} className="hour-line" style={{ top }}>
                <span>{minutesToTime(hour * 60)}</span>
              </div>
            );
          })}

          <AnimatePresence>
            {dayAppointments.map((appt) => (
              <AppointmentBlock
                key={appt.id}
                appointment={appt}
                openMinutes={openMinutes}
                pxPerMinute={PX_PER_MINUTE}
                onSelect={onSelectAppointment}
                onMarkDone={onMarkDone}
                onCancel={onCancelAppointment}
                onDelete={onDeleteAppointment}
              />
            ))}
          </AnimatePresence>

          <AnimatePresence>
            {flashId && (
              <motion.div
                key={flashId}
                className="save-pulse"
                initial={{ opacity: 0.7, scale: 0.6 }}
                animate={{ opacity: 0, scale: 1.4 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7 }}
              />
            )}
          </AnimatePresence>
        </div>
      </section>

      <div className="fab-wrap">
        <motion.button
          type="button"
          className="fab"
          onClick={onAdd}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 22,
            delay: 0.2,
          }}
        >
          + Add appointment
        </motion.button>
      </div>
    </div>
  );
}
