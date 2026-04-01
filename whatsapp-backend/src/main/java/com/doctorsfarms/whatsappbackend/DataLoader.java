package com.doctorsfarms.whatsappbackend;

import com.doctorsfarms.whatsappbackend.model.Inquiry;
import com.doctorsfarms.whatsappbackend.model.Room;
import com.doctorsfarms.whatsappbackend.repository.InquiryRepository;
import com.doctorsfarms.whatsappbackend.repository.RoomRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.io.File;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Component
public class DataLoader implements CommandLineRunner {

    private final RoomRepository roomRepository;
    private final InquiryRepository inquiryRepository;
    private final ObjectMapper objectMapper;

    public DataLoader(RoomRepository roomRepository, InquiryRepository inquiryRepository, ObjectMapper objectMapper) {
        this.roomRepository = roomRepository;
        this.inquiryRepository = inquiryRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public void run(String... args) throws Exception {
        // Load sample rooms if none exist
        if (roomRepository.count() == 0) {
            Room deluxeRoom = new Room();
            deluxeRoom.setName("Deluxe Room");
            deluxeRoom.setDescription("Spacious room with garden view");
            deluxeRoom.setCapacity(2);
            deluxeRoom.setPricePerNight(BigDecimal.valueOf(5000));
            deluxeRoom.setAvailable(true);

            Room suite = new Room();
            suite.setName("Executive Suite");
            suite.setDescription("Luxury suite with private balcony");
            suite.setCapacity(4);
            suite.setPricePerNight(BigDecimal.valueOf(8000));
            suite.setAvailable(true);

            roomRepository.save(deluxeRoom);
            roomRepository.save(suite);
            System.out.println("✅ Sample rooms loaded!");
        }

        // Migrate inquiries from JSON file if database is empty
        if (inquiryRepository.count() == 0) {
            migrateInquiriesFromJson();
        }
    }

    private void migrateInquiriesFromJson() {
        try {
            // Try to read from the Node.js backend inquiries.json file
            File jsonFile = new File("../backend/inquiries.json");
            if (jsonFile.exists()) {
                List<Map<String, Object>> jsonInquiries = objectMapper.readValue(
                    jsonFile, new TypeReference<List<Map<String, Object>>>() {}
                );

                System.out.println("📋 Found " + jsonInquiries.size() + " inquiries in JSON file. Migrating...");

                for (Map<String, Object> jsonInquiry : jsonInquiries) {
                    Inquiry inquiry = new Inquiry();
                    inquiry.setInquiryId((String) jsonInquiry.get("id"));
                    inquiry.setName((String) jsonInquiry.get("name"));
                    inquiry.setEmail((String) jsonInquiry.get("email"));
                    inquiry.setPhone((String) jsonInquiry.getOrDefault("phone", ""));
                    inquiry.setStay((String) jsonInquiry.getOrDefault("stay", "N/A"));
                    inquiry.setMessage((String) jsonInquiry.get("message"));

                    // Parse status
                    String status = (String) jsonInquiry.getOrDefault("status", "unpaid");
                    if ("paid".equals(status)) {
                        inquiry.setStatus(Inquiry.InquiryStatus.PAID);
                    } else if ("payment_initiated".equals(status)) {
                        inquiry.setStatus(Inquiry.InquiryStatus.PAYMENT_INITIATED);
                    } else {
                        inquiry.setStatus(Inquiry.InquiryStatus.UNPAID);
                    }

                    // Parse createdAt
                    String createdAtStr = (String) jsonInquiry.get("createdAt");
                    if (createdAtStr != null) {
                        try {
                            LocalDateTime createdAt = LocalDateTime.parse(createdAtStr,
                                DateTimeFormatter.ISO_LOCAL_DATE_TIME);
                            inquiry.setCreatedAt(createdAt);
                        } catch (Exception e) {
                            // Use current time if parsing fails
                            inquiry.setCreatedAt(LocalDateTime.now());
                        }
                    }

                    // Handle payment data
                    @SuppressWarnings("unchecked")
                    Map<String, Object> payment = (Map<String, Object>) jsonInquiry.get("payment");
                    if (payment != null) {
                        Map<String, String> paymentMap = new java.util.HashMap<>();
                        payment.forEach((key, value) ->
                            paymentMap.put(key, value != null ? value.toString() : ""));
                        inquiry.setPayment(paymentMap);
                    }

                    inquiryRepository.save(inquiry);
                }

                System.out.println("✅ Successfully migrated " + jsonInquiries.size() + " inquiries from JSON to database!");
            } else {
                System.out.println("ℹ️  No inquiries.json file found for migration. Starting with empty database.");
            }
        } catch (Exception e) {
            System.err.println("❌ Error migrating inquiries from JSON: " + e.getMessage());
        }
    }
}