package com.hospital.hms.config;

import com.hospital.hms.ai.AiProvider;
import com.hospital.hms.ai.GeminiAiProvider;
import com.hospital.hms.ai.OpenAiAiProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class AiConfig {

    @Bean
    public WebClient.Builder webClientBuilder() {
        return WebClient.builder();
    }

    /**
     * Exposes exactly one {@link AiProvider} to the rest of the app, chosen by
     * {@code app.ai.provider}. Everything downstream (AiService, controllers)
     * depends only on the {@link AiProvider} interface, so switching between
     * Gemini and OpenAI is a single environment variable — no code changes.
     */
    @Bean
    public AiProvider aiProvider(
            @Value("${app.ai.provider}") String provider,
            GeminiAiProvider geminiAiProvider,
            OpenAiAiProvider openAiAiProvider) {
        return switch (provider.toLowerCase()) {
            case "openai" -> openAiAiProvider;
            case "gemini" -> geminiAiProvider;
            default -> throw new IllegalStateException(
                    "Unknown app.ai.provider '" + provider + "' — expected 'gemini' or 'openai'");
        };
    }
}
