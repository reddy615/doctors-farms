package com.doctorsfarms.whatsappbackend.service;

import com.doctorsfarms.whatsappbackend.model.Inquiry;
import com.doctorsfarms.whatsappbackend.repository.InquiryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import org.springframework.beans.factory.annotation.Value;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@Service
public class InquiryService {

    @Autowired
    private InquiryRepository inquiryRepository;

    @Autowired
    private EmailService emailService;

    @Value("${app.contact.email:}")
    private String contactEmail;

    @Value("${app.admin.emails:}")
    private String adminEmailsList;

    private final String defaultContactEmail = "doctorsfarms686@gmail.com";


    public Inquiry createInquiry(String name, String email, String phone, String stay, String message) {
        String inquiryId = "INQ_" + System.currentTimeMillis() + "_" + (int)(Math.random() * 100000);

        Inquiry inquiry = new Inquiry(inquiryId, name, email, phone != null ? phone : "", stay != null ? stay : "N/A", message);
        inquiry.setStatus(Inquiry.InquiryStatus.UNPAID);

        return inquiryRepository.save(inquiry);
    }

    public Map<String, Object> sendInquiryEmails(Inquiry inquiry) {
        CompletableFuture<Boolean> adminFuture = CompletableFuture.supplyAsync(() -> {
            try {
                return emailService.sendInquiryAdminNotification(inquiry);
            } catch (Exception e) {
                System.err.println("❌ [InquiryService] Admin email error: " + e.getMessage());
                return false;
            }
        }).exceptionally(ex -> {
            System.err.println("❌ [InquiryService] Admin future failed: " + ex.getMessage());
            return false;
        });

        // Wait for the admin notification to complete (with a reasonable timeout)
        try {
            CompletableFuture.allOf(adminFuture).get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            System.err.println("⚠️ [InquiryService] Waiting for email futures timed out or failed: " + e.getMessage());
        }

        boolean adminEmailSent = false;
        try { adminEmailSent = adminFuture.getNow(false); } catch (Exception ignored) {}

        Map<String, String> emailResults = new HashMap<>();
        emailResults.put("admin", adminEmailSent ? "sent" : "failed");

        String emailStatus;
        if (adminEmailSent) {
            emailStatus = "sent";
        } else {
            emailStatus = "pending";
        }

        if (!adminEmailSent) {
            System.err.println("⚠️ [InquiryService] Email results for " + inquiry.getInquiryId() + " -> " + emailResults);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("emailStatus", emailStatus);
        result.put("emailResults", emailResults);
        result.put("adminSent", adminEmailSent);

        return result;
    }

    public List<Inquiry> getAllInquiries() {
        return inquiryRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Inquiry> getInquiriesByStatus(Inquiry.InquiryStatus status) {
        return inquiryRepository.findByStatus(status);
    }

    public Optional<Inquiry> getInquiryById(String inquiryId) {
        return inquiryRepository.findByInquiryId(inquiryId);
    }

    public Inquiry updateInquiryPayment(String inquiryId, String merchantTransactionId, int amount) {
        Optional<Inquiry> optionalInquiry = inquiryRepository.findByInquiryId(inquiryId);
        if (optionalInquiry.isPresent()) {
            Inquiry inquiry = optionalInquiry.get();
            inquiry.setStatus(Inquiry.InquiryStatus.PAYMENT_INITIATED);

            Map<String, String> payment = new HashMap<>();
            payment.put("status", "initiated");
            payment.put("merchantTransactionId", merchantTransactionId);
            payment.put("amount", String.valueOf(amount));
            payment.put("updatedAt", LocalDateTime.now().toString());
            inquiry.setPayment(payment);

            return inquiryRepository.save(inquiry);
        }
        throw new RuntimeException("Inquiry not found: " + inquiryId);
    }

    public Inquiry markInquiryPaid(String merchantTransactionId, Map<String, Object> callbackData) {
        List<Inquiry> inquiries = inquiryRepository.findAll();
        for (Inquiry inquiry : inquiries) {
            if (inquiry.getPayment() != null &&
                merchantTransactionId.equals(inquiry.getPayment().get("merchantTransactionId"))) {
                inquiry.setStatus(Inquiry.InquiryStatus.PAID);

                Map<String, String> payment = inquiry.getPayment();
                payment.put("status", "paid");
                payment.put("callback", callbackData.toString());
                payment.put("updatedAt", LocalDateTime.now().toString());
                inquiry.setPayment(payment);

                return inquiryRepository.save(inquiry);
            }
        }
        throw new RuntimeException("Inquiry not found for transaction: " + merchantTransactionId);
    }
}