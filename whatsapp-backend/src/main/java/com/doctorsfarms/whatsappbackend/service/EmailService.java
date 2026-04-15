package com.doctorsfarms.whatsappbackend.service;

import com.doctorsfarms.whatsappbackend.model.Inquiry;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.regex.Pattern;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String defaultFrom;

    @Value("${app.contact.email:doctorsfarms686@gmail.com}")
    private String contactEmail;

    @Value("${app.admin.emails:doctorsfarms686@gmail.com}")
    private String adminEmailList;

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$", Pattern.CASE_INSENSITIVE);

    private static final int MAX_RETRIES = 3;
    private static final long RETRY_DELAY_MS = 1500;

    public boolean sendEmail(String from, String to, String subject, String htmlBody) {
        if (!isValidEmail(to)) {
            throw new IllegalArgumentException("Invalid recipient email: " + to);
        }

        String effectiveFrom = (from != null && isValidEmail(from)) ? from : defaultFrom;
        if (effectiveFrom == null || effectiveFrom.isBlank() || !isValidEmail(effectiveFrom)) {
            throw new IllegalStateException("No valid sender email configured");
        }

        Exception lastError = null;
        for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

                helper.setFrom(effectiveFrom);
                helper.setTo(to);
                helper.setSubject(subject);
                helper.setText(htmlBody, true);

                mailSender.send(message);

                System.out.println("✅ [EmailService] Sent email to " + to + " (attempt " + attempt + ")");
                return true;
            } catch (MailSendException | MessagingException e) {
                lastError = e;
                System.err.println("⚠️ [EmailService] Attempt " + attempt + " failed to send email to " + to + ": " + e.getMessage());
                if (attempt < MAX_RETRIES) {
                    try {
                        Thread.sleep(RETRY_DELAY_MS * attempt);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            } catch (Exception e) {
                lastError = e;
                System.err.println("❌ [EmailService] Unexpected error sending email to " + to + ": " + e.getMessage());
                break;
            }
        }

        if (lastError instanceof RuntimeException) {
            throw (RuntimeException) lastError;
        }
        System.err.println("❌ [EmailService] All attempts failed for " + to);
        return false;
    }

    public boolean sendInquiryAdminNotification(Inquiry inquiry) {
        String[] adminEmails = parseAdminEmails();
        String subject = "New booking inquiry from " + inquiry.getName();
        String htmlContent = composeInquiryAdminHtml(inquiry);

        boolean success = true;
        for (String adminEmail : adminEmails) {
            if (!sendEmail(defaultFrom, adminEmail.trim(), subject, htmlContent)) {
                success = false;
            }
        }

        return success;
    }

    public boolean sendInquiryUserConfirmation(Inquiry inquiry) {
        String targetUser = inquiry.getEmail();
        String subject = "Your booking inquiry " + inquiry.getInquiryId() + " received";
        String htmlContent = composeInquiryUserHtml(inquiry);

        return sendEmail(defaultFrom, targetUser, subject, htmlContent);
    }

    private String[] parseAdminEmails() {
        if (adminEmailList == null || adminEmailList.trim().isEmpty()) {
            return new String[]{contactEmail};
        }
        return Arrays.stream(adminEmailList.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .toArray(String[]::new);
    }

    private String composeInquiryAdminHtml(Inquiry inquiry) {
        return "<p><strong>Name:</strong> " + escapeHtml(inquiry.getName()) + "</p>" +
            "<p><strong>Email:</strong> " + escapeHtml(inquiry.getEmail()) + "</p>" +
            "<p><strong>Phone:</strong> " + escapeHtml(inquiry.getPhone()) + "</p>" +
            "<p><strong>Preferred stay:</strong> " + escapeHtml(inquiry.getStay()) + "</p>" +
            "<p><strong>Message:</strong><br>" + escapeHtml(inquiry.getMessage()).replace("\n", "<br>") + "</p>" +
            "<p><strong>Inquiry ID:</strong> " + escapeHtml(inquiry.getInquiryId()) + "</p>" +
            "<p><strong>Status:</strong> " + inquiry.getStatus() + "</p>" +
            "<p><em>Received at " + LocalDateTime.now() + "</em></p>";
    }

    private String composeInquiryUserHtml(Inquiry inquiry) {
        return "<div style=\"font-family:Arial,sans-serif;color:#1f2937;line-height:1.6;\">" +
            "<h2>Booking Inquiry Received</h2>" +
            "<p>Hi " + escapeHtml(inquiry.getName()) + ",</p>" +
            "<p>Thank you for reaching out. Your inquiry has been received and we will contact you soon.</p>" +
            "<p><strong>Inquiry ID:</strong> " + escapeHtml(inquiry.getInquiryId()) + "</p>" +
            "<p><strong>Stay:</strong> " + escapeHtml(inquiry.getStay()) + "</p>" +
            "<p><strong>Message:</strong><br>" + escapeHtml(inquiry.getMessage()).replace("\n", "<br>") + "</p>" +
            "<p>Best regards,<br>Doctors Farms Team</p>" +
            "</div>";
    }

    private String escapeHtml(String value) {
        if (value == null) {
            return "";
        }
        return value
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&#x27;")
            .replace("/", "&#x2F;");
    }

    private boolean isValidEmail(String email) {
        return email != null && !email.isBlank() && EMAIL_PATTERN.matcher(email.trim()).matches();
    }
}
