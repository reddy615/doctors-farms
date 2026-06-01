import { useState } from 'react';
import DateCalendarPicker from '../DateCalendarPicker';
import { useBlockedDates } from '../../hooks/useBlockedDates';
import { toDateKey } from '../../utils/dateHelpers';

interface BookingFormProps {
  onSubmit: (data: BookingData) => void;
  onCancel: () => void;
}

interface BookingData {
  customerName: string;
  email: string;
  phoneNumber: string;
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  adults: number;
  children: number;
  roomType: string;
  totalPrice: number;
}

interface BookingFormState {
  customerName: string;
  email: string;
  phoneNumber: string;
  checkInDate: string;
  checkInHour: string;
  checkInMinute: string;
  checkInPeriod: 'AM' | 'PM';
  checkOutDate: string;
  checkOutHour: string;
  checkOutMinute: string;
  checkOutPeriod: 'AM' | 'PM';
  adults: number;
  children: number;
  roomType: string;
}

export default function BookingForm({ onSubmit, onCancel }: BookingFormProps) {
  const { blockedDates } = useBlockedDates();
  const [formData, setFormData] = useState<BookingFormState>({
    customerName: '',
    email: '',
    phoneNumber: '',
    checkInDate: '',
    checkInHour: '',
    checkInMinute: '00',
    checkInPeriod: 'AM',
    checkOutDate: '',
    checkOutHour: '',
    checkOutMinute: '00',
    checkOutPeriod: 'AM',
    adults: 1,
    children: 0,
    roomType: 'Heritage Cottage',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ['adults', 'children'].includes(name) ? parseInt(value) : value,
    }));
  };

  const handleCheckInDateChange = (dates: string[]) => {
    const nextCheckInDate = dates[0] || '';
    setFormData((prev) => ({
      ...prev,
      checkInDate: nextCheckInDate,
      checkOutDate: prev.checkOutDate && nextCheckInDate && prev.checkOutDate < nextCheckInDate ? '' : prev.checkOutDate,
    }));
  };

  const handleCheckOutDateChange = (dates: string[]) => {
    setFormData((prev) => ({
      ...prev,
      checkOutDate: dates[0] || '',
    }));
  };

  const calculatePrice = () => {
    if (!formData.checkInDate || !formData.checkInHour || !formData.checkOutDate || !formData.checkOutHour) {
      return 0;
    }

    const convert12To24 = (hour: string, period: 'AM' | 'PM') => {
      let h = parseInt(hour);
      if (period === 'AM' && h === 12) h = 0;
      if (period === 'PM' && h !== 12) h += 12;
      return h;
    };

    const checkInHour24 = convert12To24(formData.checkInHour, formData.checkInPeriod);
    const checkOutHour24 = convert12To24(formData.checkOutHour, formData.checkOutPeriod);

    const checkInDateTime = new Date(`${formData.checkInDate}T${checkInHour24.toString().padStart(2, '0')}:${formData.checkInMinute}:00`);
    const checkOutDateTime = new Date(`${formData.checkOutDate}T${checkOutHour24.toString().padStart(2, '0')}:${formData.checkOutMinute}:00`);

    const diffMs = checkOutDateTime.getTime() - checkInDateTime.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours <= 0) return 0;
    if (diffHours <= 24) return 15000;

    const daysNeeded = Math.ceil(diffHours / 24);
    return 15000 * daysNeeded;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || !formData.email || !formData.phoneNumber || !formData.checkInDate || !formData.checkInHour) {
      alert('Please fill in all required fields');
      return;
    }

    const format12HourTime = (hour: string, minute: string, period: 'AM' | 'PM') => {
      const paddedHour = hour.padStart(2, '0');
      return `${paddedHour}:${minute} ${period}`;
    };

    const totalPrice = calculatePrice();

    onSubmit({
      customerName: formData.customerName,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      checkInDate: formData.checkInDate,
      checkInTime: format12HourTime(formData.checkInHour, formData.checkInMinute, formData.checkInPeriod),
      checkOutDate: formData.checkOutDate,
      checkOutTime: formData.checkOutHour ? format12HourTime(formData.checkOutHour, formData.checkOutMinute, formData.checkOutPeriod) : '',
      adults: formData.adults,
      children: formData.children,
      roomType: formData.roomType,
      totalPrice: totalPrice,
    });
  };

  return (
    <div className="booking-form-container">
      <form onSubmit={handleSubmit} className="booking-form">
        <div className="form-group">
          <label>Name *</label>
          <input
            type="text"
            name="customerName"
            value={formData.customerName}
            onChange={handleChange}
            placeholder="Your full name"
            required
          />
        </div>

        <div className="form-group">
          <label>Phone *</label>
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="10-digit mobile number"
            inputMode="tel"
            autoComplete="tel"
            required
          />
        </div>

        <div className="form-group">
          <label>Email *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Your email address"
            autoComplete="email"
            required
          />
        </div>

        <div className="form-group">
          <label>Check-in Date *</label>
          <DateCalendarPicker
            title="Select your check-in date"
            helperText="Dates blocked by admin cannot be selected."
            mode="single"
            selectedDates={formData.checkInDate ? [formData.checkInDate] : []}
            disabledDates={blockedDates}
            minDate={toDateKey(new Date())}
            onChange={handleCheckInDateChange}
          />
        </div>

        <div className="form-group">
          <label>Check-in Time *</label>
          <div className="form-row">
            <select name="checkInHour" value={formData.checkInHour} onChange={handleChange} required>
              <option value="">Hour</option>
              {Array.from({ length: 12 }, (_, index) => index + 1).map((hour) => (
                <option key={hour} value={hour.toString().padStart(2, '0')}>
                  {hour}
                </option>
              ))}
            </select>
            <select name="checkInMinute" value={formData.checkInMinute} onChange={handleChange}>
              {['00', '15', '30', '45'].map((minute) => (
                <option key={minute} value={minute}>
                  {minute}
                </option>
              ))}
            </select>
            <select name="checkInPeriod" value={formData.checkInPeriod} onChange={handleChange}>
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Check-out Date *</label>
          <DateCalendarPicker
            title="Select your check-out date"
            helperText="Choose a date after your check-in date."
            mode="single"
            selectedDates={formData.checkOutDate ? [formData.checkOutDate] : []}
            disabledDates={blockedDates}
            minDate={formData.checkInDate || toDateKey(new Date())}
            onChange={handleCheckOutDateChange}
          />
        </div>

        <div className="form-group">
          <label>Check-out Time</label>
          <div className="form-row">
            <select name="checkOutHour" value={formData.checkOutHour} onChange={handleChange}>
              <option value="">Hour</option>
              {Array.from({ length: 12 }, (_, index) => index + 1).map((hour) => (
                <option key={hour} value={hour.toString().padStart(2, '0')}>
                  {hour}
                </option>
              ))}
            </select>
            <select name="checkOutMinute" value={formData.checkOutMinute} onChange={handleChange}>
              {['00', '15', '30', '45'].map((minute) => (
                <option key={minute} value={minute}>
                  {minute}
                </option>
              ))}
            </select>
            <select name="checkOutPeriod" value={formData.checkOutPeriod} onChange={handleChange}>
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Adults</label>
            <select name="adults" value={formData.adults} onChange={handleChange}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Children</label>
            <select name="children" value={formData.children} onChange={handleChange}>
              {[0, 1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Room Type</label>
          <select name="roomType" value={formData.roomType} onChange={handleChange}>
            <option>Heritage Cottage</option>
          </select>
        </div>

        {calculatePrice() > 0 && (
          <div className="form-group" style={{ backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #16a34a' }}>
            <strong style={{ color: '#166534' }}>Total Price: ₹{calculatePrice().toLocaleString('en-IN')}</strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#4b5563' }}>
              {calculatePrice() === 15000 ? '(For 24 hours)' : `(For ${Math.ceil((new Date(`${formData.checkOutDate}T${(parseInt(formData.checkOutHour) || 0).toString().padStart(2, '0')}:${formData.checkOutMinute}:00`).getTime() - new Date(`${formData.checkInDate}T${(parseInt(formData.checkInHour) || 0).toString().padStart(2, '0')}:${formData.checkInMinute}:00`).getTime()) / (1000 * 60 * 60 * 24))} day(s))`}
            </p>
          </div>
        )}

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="cancel-btn">
            Cancel
          </button>
          <button type="submit" className="submit-btn">
            Submit Booking
          </button>
        </div>
      </form>
    </div>
  );
}
