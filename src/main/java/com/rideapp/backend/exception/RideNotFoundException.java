package com.rideapp.backend.exception;

public class RideNotFoundException extends RuntimeException {
    public RideNotFoundException(String message) { super(message); }
}