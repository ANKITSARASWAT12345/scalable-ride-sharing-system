package com.rideapp.backend.config;

import com.rideapp.backend.security.WebSocketAuthInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@EnableWebSocketMessageBroker
@Configuration
@RequiredArgsConstructor
public class WebSocketConfig  implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry){


        //message from server to client
        registry.enableSimpleBroker("/topic", "/queue");

        //message from client to server
        registry.setApplicationDestinationPrefixes("/app");

        registry.setUserDestinationPrefix("/user");


    }

    @Override

    public void registerStompEndpoints(StompEndpointRegistry registry){
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("http://localhost:4200")
                .withSockJS();
    }

    // Add to WebSocketConfig.java
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(webSocketAuthInterceptor);
        // This runs our JWT check on every incoming WebSocket message
    }

    // Also inject it via constructor:
    private final WebSocketAuthInterceptor webSocketAuthInterceptor;



}
