package com.rideapp.backend.exception;

public class PhoneAlreadyExistsException extends RuntimeException{
    public PhoneAlreadyExistsException(String message) { super(message); }
}
