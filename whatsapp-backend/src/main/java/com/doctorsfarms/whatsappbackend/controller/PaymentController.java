package com.doctorsfarms.whatsappbackend.controller;

import com.doctorsfarms.whatsappbackend.service.InquiryService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class PaymentController {

    @Autowired
    private InquiryService inquiryService;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // PhonePe configuration - should be moved to application.properties
    private final String MERCHANT_ID = System.getenv("PHONEPE_MERCHANT_ID") != null ?
        System.getenv("PHONEPE_MERCHANT_ID") : "YOUR_MERCHANT_ID";
    private final String SALT_KEY = System.getenv("PHONEPE_SALT_KEY") != null ?
        System.getenv("PHONEPE_SALT_KEY") : "YOUR_SALT_KEY";
    private final int SALT_INDEX = Integer.parseInt(System.getenv("PHONEPE_SALT_INDEX") != null ?
        System.getenv("PHONEPE_SALT_INDEX") : "1");
    private final String PHONEPE_BASE_URL = System.getenv("PHONEPE_ENV") != null &&
        "sandbox".equals(System.getenv("PHONEPE_ENV")) ?
        "https://api-sandbox.phonepe.com/apis/hermes" :
        "https://api.phonepe.com/apis/hermes";

    private final String FRONTEND_URL = System.getenv("FRONTEND_URL") != null ?
        System.getenv("FRONTEND_URL") : "http://localhost:5174";
    private final String BACKEND_URL = System.getenv("BACKEND_URL") != null ?
        System.getenv("BACKEND_URL") : "http://localhost:5003";

    // Generate SHA256 hash for PhonePe
    private String generateHash(String data) {
        try {
            String hashString = data + SALT_KEY;
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(hashString.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString() + "###" + SALT_INDEX;
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    @PostMapping("/create-payment")
    public ResponseEntity<Map<String, Object>> createPayment(@RequestBody Map<String, Object> request) {
        try {
            int amount = ((Number) request.get("amount")).intValue();
            String name = (String) request.get("name");
            String email = (String) request.get("email");
            String inquiryId = (String) request.get("inquiryId");

            // Update inquiry with payment initiation
            inquiryService.updateInquiryPayment(inquiryId, "TXN_" + System.currentTimeMillis(), amount);

            String merchantTransactionId = "TXN_" + System.currentTimeMillis();

            Map<String, Object> payload = new HashMap<>();
            payload.put("merchantId", MERCHANT_ID);
            payload.put("merchantTransactionId", merchantTransactionId);
            payload.put("merchantUserId", "USER_" + System.currentTimeMillis());
            payload.put("amount", amount * 100); // Amount in paisa
            payload.put("redirectUrl", FRONTEND_URL + "/payment-success");
            payload.put("redirectMode", "REDIRECT");
            payload.put("callbackUrl", BACKEND_URL + "/api/payment-callback");
            payload.put("mobileNumber", "9999999999"); // Optional
            Map<String, Object> paymentInstrument = new HashMap<>();
            paymentInstrument.put("type", "PAY_PAGE");
            payload.put("paymentInstrument", paymentInstrument);

            String payloadJson = objectMapper.writeValueAsString(payload);
            String base64Payload = Base64.getEncoder().encodeToString(payloadJson.getBytes(StandardCharsets.UTF_8));
            String hash = generateHash(base64Payload);

            Map<String, Object> phonePeRequest = new HashMap<>();
            phonePeRequest.put("request", base64Payload);

            Map<String, String> headers = new HashMap<>();
            headers.put("Content-Type", "application/json");
            headers.put("X-VERIFY", hash);

            // In a real implementation, you'd make the HTTP call to PhonePe
            // For now, we'll simulate a successful response
            Map<String, Object> simulatedResponse = new HashMap<>();
            Map<String, Object> data = new HashMap<>();
            Map<String, Object> instrumentResponse = new HashMap<>();
            Map<String, Object> redirectInfo = new HashMap<>();
            redirectInfo.put("url", "https://phonepe.com/pay?simulated=true");
            instrumentResponse.put("redirectInfo", redirectInfo);
            data.put("instrumentResponse", instrumentResponse);
            simulatedResponse.put("data", data);

            System.out.println("Payment creation simulated for inquiry: " + inquiryId);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "paymentUrl", redirectInfo.get("url")
            ));

        } catch (Exception e) {
            System.err.println("Payment creation failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "error", "Payment creation failed: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/payment-callback")
    public ResponseEntity<Map<String, Object>> paymentCallback(@RequestBody Map<String, Object> callbackData) {
        System.out.println("Payment callback received: " + callbackData);

        try {
            String transactionId = (String) callbackData.get("merchantTransactionId");
            if (transactionId == null) {
                transactionId = (String) callbackData.get("paymentId");
            }

            if (transactionId == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Missing transaction identifier"
                ));
            }

            inquiryService.markInquiryPaid(transactionId, callbackData);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Payment callback processed successfully"
            ));

        } catch (Exception e) {
            System.err.println("Payment callback processing failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "error", "Callback processing failed: " + e.getMessage()
            ));
        }
    }
}