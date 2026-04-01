package com.doctorsfarms.whatsappbackend.repository;

import com.doctorsfarms.whatsappbackend.model.Inquiry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InquiryRepository extends JpaRepository<Inquiry, Long> {

    Optional<Inquiry> findByInquiryId(String inquiryId);

    List<Inquiry> findByStatus(Inquiry.InquiryStatus status);

    List<Inquiry> findAllByOrderByCreatedAtDesc();
}