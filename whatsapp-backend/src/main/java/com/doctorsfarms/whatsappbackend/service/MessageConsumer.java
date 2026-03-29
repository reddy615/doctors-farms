package com.doctorsfarms.whatsappbackend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class MessageConsumer {

    private final ConversationService conversationService;
    private final WhatsAppService whatsAppService;
    private final ObjectMapper objectMapper;

    public MessageConsumer(ConversationService conversationService,
                          WhatsAppService whatsAppService,
                          ObjectMapper objectMapper) {
        this.conversationService = conversationService;
        this.whatsAppService = whatsAppService;
        this.objectMapper = objectMapper;
    }

    @RabbitListener(queues = "whatsapp.messages")
    public void processMessage(String messageJson) {
        try {
            JsonNode message = objectMapper.readTree(messageJson);
            String from = message.get("from").asText();
            String text = message.get("text").asText();

            // Process message based on conversation state
            processUserMessage(from, text);

        } catch (Exception e) {
            System.err.println("Error processing message: " + e.getMessage());
        }
    }

    private void processUserMessage(String from, String text) {
        // Simple processing - can be enhanced with AI/chatbot logic
        if (text.toLowerCase().contains("book")) {
            whatsAppService.sendTextMessage(from, "Let's book a room! Please provide your check-in date (YYYY-MM-DD):");
            conversationService.updateConversationState(from,
                com.doctorsfarms.whatsappbackend.model.Conversation.ConversationState.BOOKING_START,
                Map.of("step", "checkin"));
        } else if (text.toLowerCase().contains("menu")) {
            whatsAppService.sendTextMessage(from, "Here's our dining menu: [Link to menu]");
        } else {
            whatsAppService.sendTextMessage(from, "Hello! How can I help you today? You can say 'book room' or 'menu'");
        }
    }
}