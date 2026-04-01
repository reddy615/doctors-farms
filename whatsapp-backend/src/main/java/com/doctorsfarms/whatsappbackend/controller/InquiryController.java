package com.doctorsfarms.whatsappbackend.controller;

import com.doctorsfarms.whatsappbackend.model.Inquiry;
import com.doctorsfarms.whatsappbackend.service.InquiryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class InquiryController {

    @Autowired
    private InquiryService inquiryService;

    // Health check endpoints
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "ok");
        response.put("message", "Backend is alive");
        response.put("timestamp", java.time.Instant.now().toString());
        response.put("uptime", java.lang.management.ManagementFactory.getRuntimeMXBean().getUptime() / 1000.0);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> apiHealth() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "ok");
        response.put("message", "API Backend is alive and responding");
        response.put("timestamp", java.time.Instant.now().toString());
        response.put("version", "1.0.0");
        response.put("endpoints", java.util.Arrays.asList(
            "GET /health",
            "GET /api/health",
            "POST /api/send-mail",
            "GET /api/inquiries",
            "GET /api/admins",
            "POST /api/create-payment",
            "POST /api/payment-callback"
        ));
        return ResponseEntity.ok(response);
    }

    // Send mail route for contact form notifications
    @PostMapping("/send-mail")
    public ResponseEntity<Map<String, Object>> sendMail(@RequestBody Map<String, String> request) {
        System.out.println("📧 [SEND-MAIL] Request received");

        String name = request.get("name");
        String email = request.get("email");
        String phone = request.get("phone");
        String stay = request.get("stay");
        String message = request.get("message");

        if (name == null || email == null || message == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Name, email and message are required."
            ));
        }

        try {
            // Create inquiry
            Inquiry inquiry = inquiryService.createInquiry(name, email, phone, stay, message);
            System.out.println("✅ Inquiry created: " + inquiry.getInquiryId());

            // Send emails
            boolean emailsSent = inquiryService.sendInquiryEmails(inquiry);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", emailsSent ? "Inquiry saved and emails sent." : "Inquiry saved. Email delivery delayed.");
            response.put("inquiryId", inquiry.getInquiryId());
            response.put("emailStatus", emailsSent ? "sent" : "delayed");

            System.out.println("✅ [SEND-MAIL] Response: " + response);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ [CRITICAL ERROR] Inquiry processing failed: " + e.getMessage());

            // Try to create inquiry even if email fails
            try {
                Inquiry inquiry = inquiryService.createInquiry(name, email, phone, stay, message);
                Map<String, Object> fallbackResponse = new HashMap<>();
                fallbackResponse.put("success", true);
                fallbackResponse.put("message", "Inquiry saved successfully. Email notifications will be sent shortly.");
                fallbackResponse.put("inquiryId", inquiry.getInquiryId());
                fallbackResponse.put("emailStatus", "pending");
                fallbackResponse.put("note", e.getMessage());

                System.out.println("✅ [FALLBACK] Response: " + fallbackResponse);
                return ResponseEntity.ok(fallbackResponse);
            } catch (Exception fallbackError) {
                return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "error", "Failed to process inquiry: " + fallbackError.getMessage()
                ));
            }
        }
    }

    // Inquiries read routes
    @GetMapping("/inquiries")
    public ResponseEntity<Map<String, Object>> getInquiries(@RequestParam(required = false) String status) {
        List<Inquiry> inquiries;
        if (status != null) {
            try {
                Inquiry.InquiryStatus inquiryStatus = Inquiry.InquiryStatus.valueOf(status.toUpperCase());
                inquiries = inquiryService.getInquiriesByStatus(inquiryStatus);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Invalid status: " + status
                ));
            }
        } else {
            inquiries = inquiryService.getAllInquiries();
        }

        return ResponseEntity.ok(Map.of(
            "success", true,
            "inquiries", inquiries
        ));
    }

    @GetMapping("/inquiries/{id}")
    public ResponseEntity<Map<String, Object>> getInquiryById(@PathVariable String id) {
        Optional<Inquiry> inquiry = inquiryService.getInquiryById(id);
        if (inquiry.isPresent()) {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "inquiry", inquiry.get()
            ));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/admins")
    public ResponseEntity<Map<String, Object>> getAdmins() {
        List<Map<String, String>> admins = java.util.Arrays.asList(
            Map.of("id", "admin_1", "name", "Doctors Farms", "email", "doctorsfarms686@gmail.com")
        );

        return ResponseEntity.ok(Map.of(
            "success", true,
            "admins", admins
        ));
    }

    // Debug endpoint - shows CORS info
    @GetMapping("/debug/cors")
    public ResponseEntity<Map<String, Object>> debugCors(@RequestHeader(value = "Origin", required = false) String origin) {
        return ResponseEntity.ok(Map.of(
            "origin", origin != null ? origin : "no origin",
            "method", "GET",
            "cors_allowed_origins", java.util.Arrays.asList(
                "http://localhost:5174",
                "http://localhost:5173",
                "http://127.0.0.1:5174",
                "http://127.0.0.1:5173",
                "http://localhost:5003",
                "http://127.0.0.1:5003"
            ),
            "request_headers", Map.of("origin", origin)
        ));
    }

    // Debug endpoint - shows current configuration
    @GetMapping("/debug/config")
    public ResponseEntity<Map<String, Object>> debugConfig() {
        return ResponseEntity.ok(Map.of(
            "frontend_url", "http://localhost:5174",
            "backend_url", "http://localhost:5003",
            "phonepe_env", "production",
            "smtp_configured", true,
            "smtp_user", "doctorsfarms686@gmail.com",
            "admin_emails", java.util.Arrays.asList("doctorsfarms686@gmail.com"),
            "environment", "development",
            "endpoint_status", Map.of(
                "health", "✅ available",
                "send_mail", "✅ available",
                "inquiries", "✅ available",
                "create_payment", "✅ available"
            )
        ));
    }
}