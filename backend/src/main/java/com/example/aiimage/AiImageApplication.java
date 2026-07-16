package com.example.aiimage;

import com.example.aiimage.model.entity.User;
import com.example.aiimage.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.retry.annotation.EnableRetry;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@SpringBootApplication
@EnableRetry
public class AiImageApplication {
    public static void main(String[] args) {
        SpringApplication.run(AiImageApplication.class, args);
    }

    @Bean
    CommandLineRunner initAdmin(UserRepository userRepository) {
        return args -> {
            if (userRepository.findByUsername("admin").isEmpty()) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setPassword(new BCryptPasswordEncoder().encode("admin123"));
                admin.setNickname("管理员");
                admin.setRole("ADMIN");
                admin.setStatus("ENABLED");
                userRepository.save(admin);
                System.out.println(">>> 默认管理员已创建: admin / admin123");
            }
        };
    }
}
