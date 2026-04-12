package com.rideapp.backend.exception;

public class EmailAlreadyExistsException  extends RuntimeException{

    public EmailAlreadyExistsException(String message) { super(message); }
}
