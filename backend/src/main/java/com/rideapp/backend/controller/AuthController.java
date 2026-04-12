package com.rideapp.backend.controller;


import com.rideapp.backend.dto.request.LoginRequest;
import com.rideapp.backend.dto.request.RegisterRequest;
import com.rideapp.backend.dto.response.AuthResponse;
import com.rideapp.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController                     // marks this as a REST API controller
@RequestMapping("/api/auth")        // all endpoints in this class start with /api/auth
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/register")       // handles POST /api/auth/register
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        // @Valid triggers the validation annotations in RegisterRequest
        // @RequestBody parses the incoming JSON into a RegisterRequest object
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")          // handles POST /api/auth/login
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
}
