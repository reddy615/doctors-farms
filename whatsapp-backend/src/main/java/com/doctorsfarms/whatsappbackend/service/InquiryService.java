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

    public boolean sendInquiryEmails(Inquiry inquiry) {
        boolean adminEmailSent = emailService.sendInquiryAdminNotification(inquiry);
        boolean userEmailSent = emailService.sendInquiryUserConfirmation(inquiry);

        if (!adminEmailSent || !userEmailSent) {
            System.err.println("⚠️ [InquiryService] Some emails may have failed for inquiry " + inquiry.getInquiryId());
        }

        return adminEmailSent && userEmailSent;
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