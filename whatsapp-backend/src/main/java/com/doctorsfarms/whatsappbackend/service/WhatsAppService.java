package com.doctorsfarms.whatsappbackend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class WhatsAppService {

    @Value("${whatsapp.api.url}")
    private String apiUrl;

    @Value("${whatsapp.api.token}")
    private String apiToken;

    @Value("${whatsapp.phone.number.id}")
    private String phoneNumberId;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public WhatsAppService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public void sendTextMessage(String to, String message) {
        String url = apiUrl + "/" + phoneNumberId + "/messages";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiToken);

        Map<String, Object> body = new HashMap<>();
        body.put("messaging_product", "whatsapp");
        body.put("to", to);
        body.put("type", "text");

        Map<String, String> text = new HashMap<>();
        text.put("body", message);
        body.put("text", text);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            if (response.getStatusCode() != HttpStatus.OK) {
                throw new RuntimeException("Failed to send message: " + response.getBody());
            }
        } catch (Exception e) {
            throw new RuntimeException("Error sending WhatsApp message", e);
        }
    }

    public void sendInteractiveMessage(String to, String message, Map<String, Object> interactive) {
        String url = apiUrl + "/" + phoneNumberId + "/messages";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiToken);

        Map<String, Object> body = new HashMap<>();
        body.put("messaging_product", "whatsapp");
        body.put("to", to);
        body.put("type", "interactive");
        body.put("interactive", interactive);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            if (response.getStatusCode() != HttpStatus.OK) {
                throw new RuntimeException("Failed to send interactive message: " + response.getBody());
            }
        } catch (Exception e) {
            throw new RuntimeException("Error sending WhatsApp interactive message", e);
        }
    }
}