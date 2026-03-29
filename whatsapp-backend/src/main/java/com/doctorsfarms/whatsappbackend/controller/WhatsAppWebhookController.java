package com.doctorsfarms.whatsappbackend.controller;

import com.doctorsfarms.whatsappbackend.service.ConversationService;
import com.doctorsfarms.whatsappbackend.service.WhatsAppService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/webhook")
public class WhatsAppWebhookController {

    @Value("${whatsapp.verify.token}")
    private String verifyToken;

    private final WhatsAppService whatsAppService;
    private final ConversationService conversationService;
    private final ObjectMapper objectMapper;
    private final RabbitTemplate rabbitTemplate;

    public WhatsAppWebhookController(WhatsAppService whatsAppService,
                                   ConversationService conversationService,
                                   ObjectMapper objectMapper,
                                   RabbitTemplate rabbitTemplate) {
        this.whatsAppService = whatsAppService;
        this.conversationService = conversationService;
        this.objectMapper = objectMapper;
        this.rabbitTemplate = rabbitTemplate;
    }

    @GetMapping("/whatsapp")
    public ResponseEntity<String> verifyWebhook(@RequestParam("hub.mode") String mode,
                                              @RequestParam("hub.challenge") String challenge,
                                              @RequestParam("hub.verify_token") String token) {
        if ("subscribe".equals(mode) && verifyToken.equals(token)) {
            return ResponseEntity.ok(challenge);
        }
        return ResponseEntity.badRequest().body("Verification failed");
    }

    @PostMapping("/whatsapp")
    public ResponseEntity<String> handleWebhook(@RequestBody String payload) {
        try {
            JsonNode root = objectMapper.readTree(payload);
            JsonNode entries = root.path("entry");

            for (JsonNode entry : entries) {
                JsonNode changes = entry.path("changes");
                for (JsonNode change : changes) {
                    JsonNode value = change.path("value");
                    JsonNode messages = value.path("messages");

                    for (JsonNode message : messages) {
                        String from = message.path("from").asText();
                        String messageType = message.path("type").asText();

                        if ("text".equals(messageType)) {
                            String text = message.path("text").path("body").asText();
                            handleTextMessage(from, text);
                        }
                        // Handle other message types (image, voice, etc.)
                    }
                }
            }

            return ResponseEntity.ok("EVENT_RECEIVED");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error processing webhook");
        }
    }

    private void handleTextMessage(String from, String text) {
        // Send message to queue for processing
        Map<String, String> messageData = Map.of(
            "from", from,
            "text", text
        );
        try {
            String messageJson = objectMapper.writeValueAsString(messageData);
            rabbitTemplate.convertAndSend("whatsapp.messages", messageJson);
        } catch (Exception e) {
            System.err.println("Error sending message to queue: " + e.getMessage());
        }
    }
}