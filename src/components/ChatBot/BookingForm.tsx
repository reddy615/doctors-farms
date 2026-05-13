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
  checkOutDate: string;
  adults: number;
  children: number;
  roomType: string;
}

export default function BookingForm({ onSubmit, onCancel }: BookingFormProps) {
  const [formData, setFormData] = useState<BookingData>({
    customerName: '',
    email: '',
    phoneNumber: '',
    checkInDate: '',
    checkOutDate: '',
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
    if (!formData.customerName || !formData.email || !formData.phoneNumber || !formData.checkInDate) {
      alert('Please fill in all required fields');
      return;
    }
    onSubmit(formData);
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
          <label>Check-out Date *</label>
          <input
            type="date"
            name="checkOutDate"
            value={formData.checkOutDate}
            onChange={handleChange}
            min={formData.checkInDate || new Date().toISOString().split('T')[0]}
          />
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
