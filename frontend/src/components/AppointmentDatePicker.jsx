import { useId, useRef, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import { FiCalendar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { todayKey, validDate } from '../utils/formValidation.js';
import { adjacentMonth, calendarDateKey, calendarDays, calendarMonths } from '../utils/calendar.js';
import '../styles/calendar.css';

const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const fullWeekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function AppointmentDatePicker({ id, value, onChange, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(() => {
    const current = validDate(value) ? value : todayKey();
    return { year: Number(current.slice(0, 4)), month: Number(current.slice(5, 7)) - 1 };
  });
  const titleId = useId();
  const selectedDay = useRef(null);
  const today = todayKey();
  const displayDate = validDate(value) ? value.split('-').reverse().join('/') : 'Seleccionar fecha';
  const { year, month } = visible;
  const years = Array.from(
    { length: Math.min(9999, year + 10) - Math.max(1, year - 10) + 1 },
    (_, i) => Math.max(1, year - 10) + i,
  );
  const cells = calendarDays(year, month);
  function showCalendar() {
    const current = validDate(value) ? value : today;
    setVisible({ year: Number(current.slice(0, 4)), month: Number(current.slice(5, 7)) - 1 });
    setOpen(true);
  }
  function choose(date) {
    onChange(date);
    setOpen(false);
  }
  return (
    <>
      <button
        id={id}
        type="button"
        className="form-control appointment-date-trigger"
        disabled={disabled}
        aria-label={'Elegir fecha del turno' + (validDate(value) ? ', ' + displayDate : '')}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={showCalendar}
      >
        <span>{displayDate}</span>
        <FiCalendar aria-hidden="true" />
      </button>
      <Modal
        show={open}
        onHide={() => setOpen(false)}
        centered
        size="sm"
        className="appointment-calendar-modal"
        aria-labelledby={titleId}
        onEntered={() => selectedDay.current?.focus()}
        restoreFocus
      >
        <Modal.Header closeButton closeLabel="Cerrar calendario">
          <Modal.Title id={titleId}>Elegir fecha del turno</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="appointment-calendar-navigation">
            <button
              type="button"
              className="icon-button"
              aria-label="Mes anterior"
              disabled={year === 1 && month === 0}
              onClick={() => setVisible(adjacentMonth(year, month, -1))}
            >
              <FiChevronLeft aria-hidden="true" />
            </button>
            <label className="visually-hidden" htmlFor={titleId + '-month'}>
              Mes
            </label>
            <select
              id={titleId + '-month'}
              className="form-select"
              value={month}
              onChange={(event) =>
                setVisible((current) => ({ ...current, month: Number(event.target.value) }))
              }
            >
              {calendarMonths.map((name, index) => (
                <option key={name} value={index}>
                  {name}
                </option>
              ))}
            </select>
            <label className="visually-hidden" htmlFor={titleId + '-year'}>
              Año
            </label>
            <select
              id={titleId + '-year'}
              className="form-select"
              value={year}
              onChange={(event) =>
                setVisible((current) => ({ ...current, year: Number(event.target.value) }))
              }
            >
              {years.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="icon-button"
              aria-label="Mes siguiente"
              disabled={year === 9999 && month === 11}
              onClick={() => setVisible(adjacentMonth(year, month, 1))}
            >
              <FiChevronRight aria-hidden="true" />
            </button>
          </div>
          <p className="visually-hidden" aria-live="polite">
            {calendarMonths[month]} de {year}
          </p>
          <table
            className="appointment-calendar"
            aria-label={calendarMonths[month] + ' de ' + year}
          >
            <thead>
              <tr>
                {weekDays.map((day, index) => (
                  <th scope="col" key={day}>
                    <abbr title={fullWeekDays[index]}>{day}</abbr>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: cells.length / 7 }, (_, week) => (
                <tr key={week}>
                  {cells.slice(week * 7, week * 7 + 7).map((day, index) => {
                    const date = day ? calendarDateKey(year, month, day) : '';
                    return (
                      <td key={index}>
                        {day && (
                          <button
                            type="button"
                            ref={
                              date === (validDate(value) ? value : today) ? selectedDay : undefined
                            }
                            className={
                              'appointment-calendar-day' +
                              (date === value ? ' is-selected' : '') +
                              (date === today ? ' is-today' : '')
                            }
                            aria-label={`${day} de ${calendarMonths[month].toLocaleLowerCase('es')} de ${year}`}
                            aria-pressed={date === value}
                            aria-current={date === today ? 'date' : undefined}
                            onClick={() => choose(date)}
                          >
                            {day}
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="form-help mb-0">Seleccioná un día para confirmar la fecha.</p>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => setOpen(false)}
          >
            Cancelar
          </button>
          <button type="button" className="btn btn-primary" onClick={() => choose(today)}>
            Hoy
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
