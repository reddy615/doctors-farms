package com.doctorsfarms.whatsappbackend.controller;

import com.doctorsfarms.whatsappbackend.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class EmailController {

    @Autowired
    private EmailService emailService;

    @PostMapping("/send-email")
    public ResponseEntity<Map<String, Object>> sendEmail(@RequestBody Map<String, String> payload) {
        String to = payload.get("to");
        String subject = payload.get("subject");
        String html = payload.get("html");
        String from = payload.get("from");

        if (to == null || subject == null || html == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Required fields: to, subject, html"
            ));
        }

        try {
            boolean sent = emailService.sendEmail(from, to, subject, html);
            if (sent) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Email sent successfully",
                    "timestamp", java.time.Instant.now().toString()
                ));
            } else {
                return ResponseEntity.status(502).body(Map.of(
                    "success", false,
                    "message", "Email send attempt failed, will retry in background"
                ));
            }
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "error", ex.getMessage()
            ));
        }
    }
}
