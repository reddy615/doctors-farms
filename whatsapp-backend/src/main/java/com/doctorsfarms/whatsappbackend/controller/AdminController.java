package com.doctorsfarms.whatsappbackend.controller;

import com.doctorsfarms.whatsappbackend.model.Conversation;
import com.doctorsfarms.whatsappbackend.repository.ConversationRepository;
import com.doctorsfarms.whatsappbackend.service.WhatsAppService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final ConversationRepository conversationRepository;
    private final WhatsAppService whatsAppService;

    public AdminController(ConversationRepository conversationRepository, WhatsAppService whatsAppService) {
        this.conversationRepository = conversationRepository;
        this.whatsAppService = whatsAppService;
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<Conversation>> getAllConversations() {
        List<Conversation> conversations = conversationRepository.findAll();
        return ResponseEntity.ok(conversations);
    }

    @PostMapping("/broadcast")
    public ResponseEntity<String> sendBroadcast(@RequestBody Map<String, String> request) {
        String message = request.get("message");
        if (message == null) {
            return ResponseEntity.badRequest().body("Message is required");
        }

        List<Conversation> conversations = conversationRepository.findAll();
        for (Conversation conv : conversations) {
            try {
                whatsAppService.sendTextMessage(conv.getPhoneNumber(), message);
            } catch (Exception e) {
                System.err.println("Failed to send to " + conv.getPhoneNumber() + ": " + e.getMessage());
            }
        }

        return ResponseEntity.ok("Broadcast sent to " + conversations.size() + " users");
    }

    @PostMapping("/reply")
    public ResponseEntity<String> replyToUser(@RequestBody Map<String, String> request) {
        String phoneNumber = request.get("phoneNumber");
        String message = request.get("message");

        if (phoneNumber == null || message == null) {
            return ResponseEntity.badRequest().body("Phone number and message are required");
        }

        whatsAppService.sendTextMessage(phoneNumber, message);
        return ResponseEntity.ok("Reply sent");
    }
}