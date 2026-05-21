package com.doctorsfarms.whatsappbackend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class HealthController {

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "ok");
        response.put("message", "Backend is alive");
        response.put("timestamp", java.time.Instant.now().toString());
        response.put("uptime", java.lang.management.ManagementFactory.getRuntimeMXBean().getUptime() / 1000.0);
        return ResponseEntity.ok(response);
    }
}