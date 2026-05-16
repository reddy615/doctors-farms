package com.doctorsfarms.whatsappbackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@SpringBootApplication
public class WhatsappBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(WhatsappBackendApplication.class, args);
    }

}

@Component
class EmailConfigurationDiagnostic implements CommandLineRunner {
    @Override
    public void run(String... args) throws Exception {
        System.out.println("\n========================================");
        System.out.println("📧 EMAIL CONFIGURATION DIAGNOSTIC");
        System.out.println("========================================");
        
        String emailUser = System.getenv("EMAIL_USER");
        String emailPass = System.getenv("EMAIL_PASS");
        String smtpHost = System.getenv("SMTP_HOST");
        
        System.out.println("EMAIL_USER: " + (emailUser != null ? "✅ SET (" + emailUser + ")" : "❌ NOT SET (will use default: doctorsfarms686@gmail.com)"));
        System.out.println("EMAIL_PASS: " + (emailPass != null ? "✅ SET" : "❌ NOT SET - EMAIL WILL FAIL!"));
        System.out.println("SMTP_HOST: " + (smtpHost != null ? "✅ SET (" + smtpHost + ")" : "❌ NOT SET (will use default: smtp.gmail.com)"));
        
        if (emailPass == null || emailPass.isBlank()) {
            System.err.println("\n⚠️  WARNING: EMAIL_PASS environment variable is NOT set!");
            System.err.println("    Admin notifications will FAIL without this!");
            System.err.println("    Set EMAIL_PASS to your Gmail App Password:");
            System.err.println("    1. Go to Google Account Security: https://myaccount.google.com/security");
            System.err.println("    2. Enable 2-Step Verification if not already enabled");
            System.err.println("    3. Generate App Password for Mail");
            System.err.println("    4. Set environment variable: EMAIL_PASS=<16-character-password>");
        } else {
            System.out.println("\n✅ EMAIL_PASS is configured. Email sending should work.");
        }
        System.out.println("========================================\n");
    }
}