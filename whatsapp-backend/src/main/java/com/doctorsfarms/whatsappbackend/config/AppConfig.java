package com.doctorsfarms.whatsappbackend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.resource.PathResourceResolver;
import java.io.IOException;

@Configuration
public class AppConfig implements WebMvcConfigurer {

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String[] allowedOrigins = {
            "http://localhost:5174",
            "http://localhost:5173",
            "http://127.0.0.1:5174",
            "http://127.0.0.1:5173",
            "http://localhost:5003",
            "http://127.0.0.1:5003",
            "http://localhost:5174",
            System.getenv("FRONTEND_URL"),
            System.getenv("RAILWAY_PUBLIC_DOMAIN") != null ?
                "https://" + System.getenv("RAILWAY_PUBLIC_DOMAIN") : null
        };

        // Filter out null values
        allowedOrigins = java.util.Arrays.stream(allowedOrigins)
            .filter(origin -> origin != null && !origin.trim().isEmpty())
            .toArray(String[]::new);

        System.out.println("✅ CORS Allowed Origins: " + java.util.Arrays.toString(allowedOrigins));

        registry.addMapping("/api/**")
            .allowedOrigins(allowedOrigins)
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(true)
            .maxAge(3600);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Serve static files from classpath:static/dist/ (for production)
        registry.addResourceHandler("/**")
            .addResourceLocations("classpath:/static/dist/", "classpath:/static/")
            .resourceChain(true)
            .addResolver(new PathResourceResolver() {
                @Override
                protected Resource getResource(String resourcePath, Resource location) throws IOException {
                    Resource requestedResource = location.createRelative(resourcePath);

                    // If the requested resource exists, return it
                    if (requestedResource.exists() && requestedResource.isReadable()) {
                        return requestedResource;
                    }

                    // For SPA routing, return index.html for any non-API route
                    if (!resourcePath.startsWith("api/") && !resourcePath.contains(".")) {
                        return new ClassPathResource("/static/dist/index.html");
                    }

                    return null;
                }
            });
    }
}
