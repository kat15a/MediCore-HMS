package com.hospital.hms.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSummaryResponse {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String role;
    private String profileImageUrl;
    private Boolean isEmailVerified;
    /** Populated only when the role has one — the Doctor/Patient/Receptionist profile id, for routing/API calls. */
    private Long profileId;
}
