package com.hospital.hms.email;

public interface EmailService {

    void sendEmailVerification(String toEmail, String firstName, String verificationToken);

    void sendPasswordReset(String toEmail, String firstName, String resetToken);

    void sendAppointmentConfirmation(String toEmail, String firstName, String doctorName,
                                      String appointmentDate, String appointmentTime);

    void sendAppointmentReminder(String toEmail, String firstName, String doctorName,
                                  String appointmentDate, String appointmentTime);

    void sendWelcomeWithCredentials(String toEmail, String firstName, String temporaryPassword);
}
