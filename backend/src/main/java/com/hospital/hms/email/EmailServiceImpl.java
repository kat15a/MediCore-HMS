package com.hospital.hms.email;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Sends transactional emails (verification, password reset, appointment
 * notifications) asynchronously so request threads never block on SMTP.
 * If mail credentials are not configured, failures are logged rather than
 * thrown, so the rest of the app keeps working in local/dev environments.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromAddress;

    @Value("${app.frontend.base-url}")
    private String frontendBaseUrl;

    @Value("${app.frontend.verify-email-path}")
    private String verifyEmailPath;

    @Value("${app.frontend.reset-password-path}")
    private String resetPasswordPath;

    @Override
    @Async
    public void sendEmailVerification(String toEmail, String firstName, String verificationToken) {
        String link = frontendBaseUrl + verifyEmailPath + "?token=" + verificationToken;
        String html = wrapTemplate(
                "Verify your email",
                "Hi " + firstName + ",",
                "Thanks for registering with MediCore. Please confirm your email address to activate your account.",
                link, "Verify Email");
        send(toEmail, "Verify your MediCore account", html);
    }

    @Override
    @Async
    public void sendPasswordReset(String toEmail, String firstName, String resetToken) {
        String link = frontendBaseUrl + resetPasswordPath + "?token=" + resetToken;
        String html = wrapTemplate(
                "Reset your password",
                "Hi " + firstName + ",",
                "We received a request to reset your password. This link expires in 1 hour. " +
                        "If you did not request this, you can safely ignore this email.",
                link, "Reset Password");
        send(toEmail, "Reset your MediCore password", html);
    }

    @Override
    @Async
    public void sendAppointmentConfirmation(String toEmail, String firstName, String doctorName,
                                             String appointmentDate, String appointmentTime) {
        String body = "Hi " + firstName + ",<br/><br/>Your appointment with <b>" + doctorName +
                "</b> on <b>" + appointmentDate + "</b> at <b>" + appointmentTime +
                "</b> has been confirmed.";
        send(toEmail, "Appointment Confirmed — MediCore", wrapSimple("Appointment Confirmed", body));
    }

    @Override
    @Async
    public void sendAppointmentReminder(String toEmail, String firstName, String doctorName,
                                         String appointmentDate, String appointmentTime) {
        String body = "Hi " + firstName + ",<br/><br/>This is a reminder that you have an appointment with <b>" +
                doctorName + "</b> on <b>" + appointmentDate + "</b> at <b>" + appointmentTime + "</b>.";
        send(toEmail, "Appointment Reminder — MediCore", wrapSimple("Appointment Reminder", body));
    }

    @Override
    @Async
    public void sendWelcomeWithCredentials(String toEmail, String firstName, String temporaryPassword) {
        String body = "Hi " + firstName + ",<br/><br/>Your MediCore staff account has been created.<br/>" +
                "Email: <b>" + toEmail + "</b><br/>Temporary password: <b>" + temporaryPassword + "</b><br/><br/>" +
                "Please log in and change your password immediately.";
        send(toEmail, "Welcome to MediCore", wrapSimple("Welcome to MediCore", body));
    }

    private void send(String toEmail, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            if (fromAddress != null && !fromAddress.isBlank()) {
                helper.setFrom(fromAddress);
            }
            mailSender.send(message);
        } catch (MessagingException | RuntimeException ex) {
            // In dev environments without SMTP credentials configured, this is expected —
            // log and move on rather than breaking registration/booking flows.
            log.warn("Failed to send email to {}: {}", toEmail, ex.getMessage());
        }
    }

    private String wrapTemplate(String heading, String greeting, String message, String linkUrl, String buttonText) {
        return "<div style='font-family:Arial,sans-serif;max-width:520px;margin:auto'>" +
                "<h2 style='color:#1976d2'>" + heading + "</h2>" +
                "<p>" + greeting + "</p>" +
                "<p>" + message + "</p>" +
                "<p style='margin:24px 0'><a href='" + linkUrl + "' " +
                "style='background:#1976d2;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none'>" +
                buttonText + "</a></p>" +
                "<p style='color:#888;font-size:12px'>If the button doesn't work, copy and paste this link: " + linkUrl + "</p>" +
                "</div>";
    }

    private String wrapSimple(String heading, String bodyHtml) {
        return "<div style='font-family:Arial,sans-serif;max-width:520px;margin:auto'>" +
                "<h2 style='color:#1976d2'>" + heading + "</h2>" +
                "<p>" + bodyHtml + "</p>" +
                "</div>";
    }
}
