package com.rideapp.backend.dto.response;

import com.rideapp.backend.model.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    private String tokenType="Bearer";
    private UUID userId;
    private String name;
    private String email;
    private Role role;
}
