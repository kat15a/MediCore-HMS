package com.hospital.hms.ai;

/**
 * Provider-agnostic contract for a text-completion AI backend. Concrete
 * implementations ({@link GeminiAiProvider}, {@link OpenAiAiProvider}) each
 * speak their own vendor API; every other part of the app only ever talks
 * to this interface, so swapping providers is a one-line config change
 * ({@code app.ai.provider: gemini|openai}) with zero code changes elsewhere.
 */
public interface AiProvider {

    /**
     * Sends a system instruction + user prompt to the model and returns its
     * raw text response. Callers that need structured data ask the model to
     * respond in strict JSON in the prompt itself and parse the result.
     *
     * @throws com.hospital.hms.exception.AiServiceException if the provider
     *         call fails (network error, missing API key, non-2xx response).
     */
    String complete(String systemPrompt, String userPrompt);

    String providerName();
}
