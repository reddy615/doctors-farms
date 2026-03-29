package com.doctorsfarms.whatsappbackend.controller;

import com.doctorsfarms.whatsappbackend.service.BookingService;
import com.doctorsfarms.whatsappbackend.service.WhatsAppService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/whatsapp")
public class WhatsAppApiController {

    private final WhatsAppService whatsAppService;
    private final BookingService bookingService;

    public WhatsAppApiController(WhatsAppService whatsAppService, BookingService bookingService) {
        this.whatsAppService = whatsAppService;
        this.bookingService = bookingService;
    }

    @PostMapping("/send")
    public ResponseEntity<String> sendMessage(@RequestBody Map<String, String> request) {
        String to = request.get("to");
        String message = request.get("message");

        if (to == null || message == null) {
            return ResponseEntity.badRequest().body("Missing 'to' or 'message' parameter");
        }

        whatsAppService.sendTextMessage(to, message);
        return ResponseEntity.ok("Message sent");
    }

    @PostMapping("/book-room")
    public ResponseEntity<String> bookRoom(@RequestBody Map<String, Object> request) {
        try {
            String phoneNumber = (String) request.get("phoneNumber");
            Long roomId = Long.valueOf(request.get("roomId").toString());
            LocalDate checkIn = LocalDate.parse((String) request.get("checkIn"));
            LocalDate checkOut = LocalDate.parse((String) request.get("checkOut"));
            int guests = Integer.parseInt(request.get("guests").toString());

            bookingService.createBooking(phoneNumber, roomId, checkIn, checkOut, guests);
            return ResponseEntity.ok("Booking created successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error creating booking: " + e.getMessage());
        }
    }
}