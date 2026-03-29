package com.doctorsfarms.whatsappbackend.service;

import com.doctorsfarms.whatsappbackend.model.Conversation;
import com.doctorsfarms.whatsappbackend.repository.ConversationRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@Service
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final ObjectMapper objectMapper;

    public ConversationService(ConversationRepository conversationRepository, ObjectMapper objectMapper) {
        this.conversationRepository = conversationRepository;
        this.objectMapper = objectMapper;
    }

    public Conversation getOrCreateConversation(String phoneNumber) {
        Optional<Conversation> existing = conversationRepository.findByPhoneNumber(phoneNumber);
        if (existing.isPresent()) {
            return existing.get();
        }

        Conversation newConversation = new Conversation();
        newConversation.setPhoneNumber(phoneNumber);
        newConversation.setState(Conversation.ConversationState.IDLE);
        return conversationRepository.save(newConversation);
    }

    public void updateConversationState(String phoneNumber, Conversation.ConversationState state, Map<String, Object> contextData) {
        Conversation conversation = getOrCreateConversation(phoneNumber);
        conversation.setState(state);
        try {
            conversation.setContextData(objectMapper.writeValueAsString(contextData));
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error serializing context data", e);
        }
        conversation.setLastActivity(LocalDateTime.now());
        conversationRepository.save(conversation);
    }

    public Map<String, Object> getConversationContext(String phoneNumber) {
        Conversation conversation = getOrCreateConversation(phoneNumber);
        if (conversation.getContextData() == null) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(conversation.getContextData(), Map.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error deserializing context data", e);
        }
    }

    public Conversation.ConversationState getConversationState(String phoneNumber) {
        return getOrCreateConversation(phoneNumber).getState();
    }
}