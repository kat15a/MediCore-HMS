package com.hospital.hms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Entry point for the AI Powered Hospital Management System backend.
 *
 * Enables scheduling (for reminder emails, queue resets, report cleanup jobs)
 * and async execution (for AI calls and email dispatch so requests don't block).
 */
@SpringBootApplication
@EnableScheduling
@EnableAsync
public class HmsApplication {

    public static void main(String[] args) {
        SpringApplication.run(HmsApplication.class, args);
    }
}
