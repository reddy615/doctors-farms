package com.doctorsfarms.whatsappbackend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "conversations")
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String phoneNumber;

    @Enumerated(EnumType.STRING)
    private ConversationState state = ConversationState.IDLE;

    @Column(columnDefinition = "TEXT")
    private String contextData; // JSON string for state data

    private LocalDateTime lastActivity = LocalDateTime.now();

    public enum ConversationState {
        IDLE, BOOKING_START, SELECT_DATES, SELECT_ROOM, CONFIRM_BOOKING, SUPPORT, PROMOTION
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public ConversationState getState() { return state; }
    public void setState(ConversationState state) { this.state = state; }

    public String getContextData() { return contextData; }
    public void setContextData(String contextData) { this.contextData = contextData; }

    public LocalDateTime getLastActivity() { return lastActivity; }
    public void setLastActivity(LocalDateTime lastActivity) { this.lastActivity = lastActivity; }
}