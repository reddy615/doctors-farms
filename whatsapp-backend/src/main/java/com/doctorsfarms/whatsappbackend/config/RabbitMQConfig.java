package com.doctorsfarms.whatsappbackend.config;

import org.springframework.amqp.core.Queue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String MESSAGE_QUEUE = "whatsapp.messages";

    @Bean
    public Queue messageQueue() {
        return new Queue(MESSAGE_QUEUE, true);
    }
}