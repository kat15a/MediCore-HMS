package com.hospital.hms.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.hospital.hms.exception.AiServiceException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;

/**
 * Talks to the OpenAI Chat Completions REST endpoint directly via
 * {@link WebClient}. Used when {@code app.ai.provider=openai}.
 */
@Slf4j
@Component
public class OpenAiAiProvider implements AiProvider {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String model;
    private final String baseUrl;

    public OpenAiAiProvider(
            WebClient.Builder webClientBuilder,
            ObjectMapper objectMapper,
            @Value("${app.ai.openai.api-key}") String apiKey,
            @Value("${app.ai.openai.model}") String model,
            @Value("${app.ai.openai.base-url}") String baseUrl) {
        this.webClient = webClientBuilder.build();
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.model = model;
        this.baseUrl = baseUrl;
    }

    @Override
    public String complete(String systemPrompt, String userPrompt) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new AiServiceException(
                    "The OpenAI API key is not configured. Set OPENAI_API_KEY to enable AI features.");
        }

        try {
            ObjectNode requestBody = buildRequestBody(systemPrompt, userPrompt);

            JsonNode response = webClient.post()
                    .uri(baseUrl + "/chat/completions")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .timeout(Duration.ofSeconds(30))
                    .block();

            return extractText(response);
        } catch (WebClientResponseException ex) {
            log.error("OpenAI API error [{}]: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new AiServiceException("The AI service is temporarily unavailable. Please try again shortly.", ex);
        } catch (Exception ex) {
            log.error("Unexpected error calling OpenAI", ex);
            throw new AiServiceException("The AI service is temporarily unavailable. Please try again shortly.", ex);
        }
    }

    @Override
    public String providerName() {
        return "openai";
    }

    private ObjectNode buildRequestBody(String systemPrompt, String userPrompt) {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("model", model);
        root.put("temperature", 0.4);
        root.put("max_tokens", 2048);

        ArrayNode messages = root.putArray("messages");
        ObjectNode systemMessage = messages.addObject();
        systemMessage.put("role", "system");
        systemMessage.put("content", systemPrompt);

        ObjectNode userMessage = messages.addObject();
        userMessage.put("role", "user");
        userMessage.put("content", userPrompt);

        return root;
    }

    private String extractText(JsonNode response) {
        if (response == null) {
            throw new AiServiceException("The AI service returned an empty response.");
        }
        JsonNode textNode = response.path("choices").path(0).path("message").path("content");
        if (textNode.isMissingNode() || textNode.asText().isBlank()) {
            log.warn("OpenAI response had no extractable text: {}", response);
            throw new AiServiceException("The AI service returned an unexpected response format.");
        }
        return textNode.asText();
    }
}
