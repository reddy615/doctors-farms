package com.doctorsfarms.whatsappbackend.service;

import com.doctorsfarms.whatsappbackend.model.Booking;
import com.doctorsfarms.whatsappbackend.model.Room;
import com.doctorsfarms.whatsappbackend.model.User;
import com.doctorsfarms.whatsappbackend.repository.BookingRepository;
import com.doctorsfarms.whatsappbackend.repository.RoomRepository;
import com.doctorsfarms.whatsappbackend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;

    public BookingService(BookingRepository bookingRepository, RoomRepository roomRepository, UserRepository userRepository) {
        this.bookingRepository = bookingRepository;
        this.roomRepository = roomRepository;
        this.userRepository = userRepository;
    }

    public boolean isRoomAvailable(Long roomId, LocalDate checkIn, LocalDate checkOut) {
        List<Booking> conflictingBookings = bookingRepository.findByRoomIdAndCheckInDateLessThanEqualAndCheckOutDateGreaterThanEqual(
                roomId, checkOut, checkIn);
        return conflictingBookings.stream().noneMatch(booking ->
            booking.getStatus() == Booking.BookingStatus.CONFIRMED ||
            booking.getStatus() == Booking.BookingStatus.PENDING);
    }

    public Booking createBooking(String phoneNumber, Long roomId, LocalDate checkIn, LocalDate checkOut, int guests) {
        User user = userRepository.findByPhoneNumber(phoneNumber)
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setPhoneNumber(phoneNumber);
                    return userRepository.save(newUser);
                });

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        if (!isRoomAvailable(roomId, checkIn, checkOut)) {
            throw new RuntimeException("Room not available for selected dates");
        }

        if (guests > room.getCapacity()) {
            throw new RuntimeException("Room capacity exceeded");
        }

        long nights = ChronoUnit.DAYS.between(checkIn, checkOut);
        BigDecimal totalPrice = room.getPricePerNight().multiply(BigDecimal.valueOf(nights));

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setRoom(room);
        booking.setCheckInDate(checkIn);
        booking.setCheckOutDate(checkOut);
        booking.setNumberOfGuests(guests);
        booking.setTotalPrice(totalPrice);
        booking.setStatus(Booking.BookingStatus.PENDING);

        return bookingRepository.save(booking);
    }

    public void confirmBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        booking.setStatus(Booking.BookingStatus.CONFIRMED);
        bookingRepository.save(booking);
    }

    public List<Room> getAvailableRooms() {
        return roomRepository.findByAvailableTrue();
    }
}