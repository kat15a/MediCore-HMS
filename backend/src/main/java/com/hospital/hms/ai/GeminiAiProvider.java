package com.hospital.hms.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.hospital.hms.exception.AiServiceException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;

/**
 * Talks to the Gemini "generateContent" REST endpoint directly (no SDK
 * dependency) via {@link WebClient}. Gemini takes the API key as a query
 * parameter rather than an Authorization header.
 */
@Slf4j
@Component
public class GeminiAiProvider implements AiProvider {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String model;
    private final String baseUrl;

    public GeminiAiProvider(
            WebClient.Builder webClientBuilder,
            ObjectMapper objectMapper,
            @Value("${app.ai.gemini.api-key}") String apiKey,
            @Value("${app.ai.gemini.model}") String model,
            @Value("${app.ai.gemini.base-url}") String baseUrl) {
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
                    "The Gemini API key is not configured. Set GEMINI_API_KEY to enable AI features.");
        }

        try {
            ObjectNode requestBody = buildRequestBody(systemPrompt, userPrompt);
            String url = baseUrl + "/models/" + model + ":generateContent?key=" + apiKey;

            JsonNode response = webClient.post()
                    .uri(url)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .timeout(Duration.ofSeconds(30))
                    .block();

            return extractText(response);
        } catch (WebClientResponseException ex) {
            log.error("Gemini API error [{}]: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new AiServiceException("The AI service is temporarily unavailable. Please try again shortly.", ex);
        } catch (Exception ex) {
            log.error("Unexpected error calling Gemini", ex);
            throw new AiServiceException("The AI service is temporarily unavailable. Please try again shortly.", ex);
        }
    }

    @Override
    public String providerName() {
        return "gemini";
    }

    private ObjectNode buildRequestBody(String systemPrompt, String userPrompt) {
        ObjectNode root = objectMapper.createObjectNode();

        ObjectNode systemInstruction = root.putObject("systemInstruction");
        ArrayNode systemParts = systemInstruction.putArray("parts");
        systemParts.addObject().put("text", systemPrompt);

        ArrayNode contents = root.putArray("contents");
        ObjectNode userContent = contents.addObject();
        userContent.put("role", "user");
        ArrayNode userParts = userContent.putArray("parts");
        userParts.addObject().put("text", userPrompt);

        ObjectNode generationConfig = root.putObject("generationConfig");
        generationConfig.put("temperature", 0.4);
        generationConfig.put("maxOutputTokens", 2048);

        return root;
    }

    private String extractText(JsonNode response) {
        if (response == null) {
            throw new AiServiceException("The AI service returned an empty response.");
        }
        JsonNode textNode = response.path("candidates").path(0).path("content").path("parts").path(0).path("text");
        if (textNode.isMissingNode() || textNode.asText().isBlank()) {
            log.warn("Gemini response had no extractable text: {}", response);
            throw new AiServiceException("The AI service returned an unexpected response format.");
        }
        return textNode.asText();
    }
}
