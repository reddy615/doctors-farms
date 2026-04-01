package com.doctorsfarms.whatsappbackend.service;

import com.doctorsfarms.whatsappbackend.model.Inquiry;
import com.doctorsfarms.whatsappbackend.repository.InquiryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
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
    private JavaMailSender mailSender;

    @Value("${app.contact.email:}")
    private String contactEmail;

    @Value("${app.admin.emails:}")
    private String adminEmailsList;

    @Value("${spring.mail.username:}")
    private String smtpUsername;

    private final String defaultContactEmail = "doctorsfarms686@gmail.com";
    private final String[] defaultAdminEmails = {defaultContactEmail};

    private final String contactEmail = "doctorsfarms686@gmail.com";
    private final String[] adminEmails = {contactEmail}; // Can be configured via properties

    public Inquiry createInquiry(String name, String email, String phone, String stay, String message) {
        String inquiryId = "INQ_" + System.currentTimeMillis() + "_" + (int)(Math.random() * 100000);

        Inquiry inquiry = new Inquiry(inquiryId, name, email, phone != null ? phone : "", stay != null ? stay : "N/A", message);
        inquiry.setStatus(Inquiry.InquiryStatus.UNPAID);

        return inquiryRepository.save(inquiry);
    }

    public boolean sendInquiryEmails(Inquiry inquiry) {
        String effectiveContactEmail = contactEmail != null && !contactEmail.trim().isEmpty() ?
            contactEmail : defaultContactEmail;
        String[] effectiveAdminEmails = adminEmailsList != null && !adminEmailsList.trim().isEmpty() ?
            adminEmailsList.split(",") : defaultAdminEmails;
        String effectiveSmtpUsername = smtpUsername != null && !smtpUsername.trim().isEmpty() ?
            smtpUsername : defaultContactEmail;
        boolean adminEmailSent = false;
        boolean userEmailSent = false;

        try {
            // Send admin notification email
            sendAdminNotificationEmail(inquiry, effectiveContactEmail, effectiveAdminEmails);
            adminEmailSent = true;
            System.out.println("✅ Admin email sent for inquiry: " + inquiry.getInquiryId());
        } catch (Exception e) {
            System.err.println("❌ Failed to send admin email: " + e.getMessage());
        }

        try {
            // Send user confirmation email
            sendUserConfirmationEmail(inquiry, effectiveContactEmail, effectiveSmtpUsername);
            userEmailSent = true;
            System.out.println("✅ User email sent for inquiry: " + inquiry.getInquiryId());
        } catch (Exception e) {
            System.err.println("❌ Failed to send user email: " + e.getMessage());
        }

        return adminEmailSent && userEmailSent;
    }

    private void sendAdminNotificationEmail(Inquiry inquiry, String contactEmail, String[] adminEmails) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        helper.setFrom(inquiry.getEmail());
        helper.setTo(contactEmail);
        helper.setBcc(adminEmails);
        helper.setSubject("New booking inquiry from " + inquiry.getName());

        String htmlContent = String.format(
            "<p><strong>Name:</strong> %s</p>" +
            "<p><strong>Email:</strong> %s</p>" +
            "<p><strong>Phone:</strong> %s</p>" +
            "<p><strong>Preferred stay:</strong> %s</p>" +
            "<p><strong>Message:</strong></p>" +
            "<p>%s</p>" +
            "<p><strong>Inquiry ID:</strong> %s</p>" +
            "<p><strong>Status:</strong> %s</p>",
            inquiry.getName(),
            inquiry.getEmail(),
            inquiry.getPhone(),
            inquiry.getStay(),
            inquiry.getMessage().replace("\n", "<br/>"),
            inquiry.getInquiryId(),
            inquiry.getStatus()
        );

        helper.setText(htmlContent, true);
        mailSender.send(message);
    }

    private void sendUserConfirmationEmail(Inquiry inquiry, String contactEmail, String smtpUsername) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        helper.setFrom("\"Doctors Farms\" <" + smtpUsername + ">");
        helper.setTo(inquiry.getEmail());
        helper.setSubject("Your booking inquiry " + inquiry.getInquiryId() + " received");

        String htmlContent = String.format(
            "<div style=\"font-family: Arial, sans-serif; color: #1f2937; line-height:1.6;\">" +
            "<h2>Booking Inquiry Received</h2>" +
            "<p>Hi %s,</p>" +
            "<p>Thank you for reaching out. Your inquiry has been received and we will contact you soon.</p>" +
            "<p><strong>Inquiry ID:</strong> %s</p>" +
            "<p><strong>Stay:</strong> %s</p>" +
            "<p><strong>Message:</strong><br>%s</p>" +
            "<p>Best regards,<br>Doctors Farms Team</p>" +
            "</div>",
            inquiry.getName(),
            inquiry.getInquiryId(),
            inquiry.getStay(),
            inquiry.getMessage().replace("\n", "<br>")
        );

        helper.setText(htmlContent, true);
        mailSender.send(message);
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