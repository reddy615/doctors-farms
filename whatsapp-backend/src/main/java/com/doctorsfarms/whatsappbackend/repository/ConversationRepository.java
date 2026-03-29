package com.doctorsfarms.whatsappbackend.repository;

import com.doctorsfarms.whatsappbackend.model.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    Optional<Conversation> findByPhoneNumber(String phoneNumber);
}