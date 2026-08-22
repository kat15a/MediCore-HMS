package com.hospital.hms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatRequest {

    @NotBlank(message = "Message is required")
    @Size(max = 1000, message = "Please keep your message under 1000 characters")
    private String message;

    /** Prior turns in the conversation, oldest first, for follow-up context. */
    private List<ChatTurn> history;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChatTurn {
        private String role;    // "user" | "assistant"
        private String content;
    }
}
