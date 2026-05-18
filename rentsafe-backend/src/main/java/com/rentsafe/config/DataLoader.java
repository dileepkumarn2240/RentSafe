package com.rentsafe.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataLoader implements CommandLineRunner {

    @Override
    public void run(String... args) throws Exception {
        // No dummy values. Everything will be added by the user in real-time.
        System.out.println(">>> RentSafe Ready for Real-Time Deployment (Clean Slate) <<<");
    }
}
