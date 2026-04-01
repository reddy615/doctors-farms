package com.doctorsfarms.whatsappbackend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "inquiries")
public class Inquiry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String inquiryId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String email;

    private String phone;

    private String stay;

    @Column(length = 2000)
    private String message;

    @Enumerated(EnumType.STRING)
    private InquiryStatus status = InquiryStatus.UNPAID;

    @Column(updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt = LocalDateTime.now();

    @ElementCollection
    @CollectionTable(name = "inquiry_payments", joinColumns = @JoinColumn(name = "inquiry_id"))
    @MapKeyColumn(name = "payment_key")
    @Column(name = "payment_value")
    private Map<String, String> payment;

    public enum InquiryStatus {
        UNPAID, PAYMENT_INITIATED, PAID
    }

    // Constructors
    public Inquiry() {}

    public Inquiry(String inquiryId, String name, String email, String phone, String stay, String message) {
        this.inquiryId = inquiryId;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.stay = stay;
        this.message = message;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getInquiryId() { return inquiryId; }
    public void setInquiryId(String inquiryId) { this.inquiryId = inquiryId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getStay() { return stay; }
    public void setStay(String stay) { this.stay = stay; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public InquiryStatus getStatus() { return status; }
    public void setStatus(InquiryStatus status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public Map<String, String> getPayment() { return payment; }
    public void setPayment(Map<String, String> payment) { this.payment = payment; }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}