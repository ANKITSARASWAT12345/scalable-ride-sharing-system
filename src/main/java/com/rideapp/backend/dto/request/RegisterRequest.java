package com.rideapp.backend.dto.request;


import com.rideapp.backend.model.Role;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message="Name is Required")
    @Size(min=2, max = 100, message="name must be in 2-100 characters")
    private String name;


    @NotBlank(message = "Email is required")
    @Email(message="Must be a valid email")
    private String email;

    @NotBlank(message = "Phone is required")
    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Must be a valid Indian mobile number")
    private String phone;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    @NotNull(message = "Role is required")
    private Role role;
}
