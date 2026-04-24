package com.rideapp.backend.service;


import com.rideapp.backend.dto.request.LoginRequest;
import com.rideapp.backend.dto.request.RegisterRequest;
import com.rideapp.backend.dto.response.AuthResponse;
import com.rideapp.backend.exception.EmailAlreadyExistsException;
import com.rideapp.backend.exception.PhoneAlreadyExistsException;
import com.rideapp.backend.model.User;
import com.rideapp.backend.repository.UserRepository;
import com.rideapp.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final WalletService walletService;

    public AuthResponse register(RegisterRequest request) {
        // check for duplicate email
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException("Email already registered");
        }
        // check for duplicate phone
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new PhoneAlreadyExistsException("Phone number already registered");
        }

        // build the User entity using the builder pattern from Lombok
        var user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .password(passwordEncoder.encode(request.getPassword()))  // HASH the password
                .role(request.getRole())
                .isActive(true)
                .build();

        userRepository.save(user);  // INSERT into users table
        walletService.createWallet(user);

        // generate tokens
        var accessToken = jwtService.generateToken(user);
        var refreshToken = jwtService.generateRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        // this line does everything: loads user by email, checks BCrypt password
        // throws BadCredentialsException automatically if wrong
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        // if we reach here, credentials were correct
        var user = userRepository.findByEmail(request.getEmail()).orElseThrow();

        var accessToken = jwtService.generateToken(user);
        var refreshToken = jwtService.generateRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }
}
