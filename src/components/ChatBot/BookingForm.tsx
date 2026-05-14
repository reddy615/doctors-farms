import { useState } from 'react';

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
          <input
            type="date"
            name="checkInDate"
            value={formData.checkInDate}
            onChange={handleChange}
            min={new Date().toISOString().split('T')[0]}
            required
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
          <input
            type="date"
            name="checkOutDate"
            value={formData.checkOutDate}
            onChange={handleChange}
            min={formData.checkInDate || new Date().toISOString().split('T')[0]}
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
