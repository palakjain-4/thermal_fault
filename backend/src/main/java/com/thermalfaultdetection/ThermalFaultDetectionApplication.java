package com.thermalfaultdetection;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ThermalFaultDetectionApplication {

    private static final Logger log = LoggerFactory.getLogger(ThermalFaultDetectionApplication.class);

    public static void main(String[] args) {
        log.info("Starting Deep Learning-Based Thermal Fault Detection Backend (Java 21 / Spring Boot 3.3.4)...");
        SpringApplication.run(ThermalFaultDetectionApplication.class, args);
        log.info("✅ Thermal Fault Detection Backend started successfully on port 8000.");
    }
}
