package com.hydroflow;

import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;

import java.io.*;
import java.net.InetSocketAddress;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.Executors;

/**
 * HydroFlow - Athlete Hydration Dashboard Server
 * 
 * A simple Java HTTP server that serves the hydration tracking dashboard
 * and provides API endpoints for data management.
 * 
 * To run:
 * 1. Compile: javac -d out src/main/java/com/hydroflow/*.java
 * 2. Run: java -cp out com.hydroflow.HydroFlowServer
 * 3. Open browser: http://localhost:8080
 */
public class HydroFlowServer {
    
    private static final int PORT = 8080;
    private static final String WEB_ROOT = "web";
    
    // In-memory storage (replace with database for production)
    private static Map<String, UserData> users = new HashMap<>();
    private static Map<String, HydrationData> hydrationData = new HashMap<>();
    
    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);
        
        // Static file handler
        server.createContext("/", new StaticFileHandler());
        
        // API endpoints
        server.createContext("/api/login", new LoginHandler());
        server.createContext("/api/signup", new SignupHandler());
        server.createContext("/api/hydration", new HydrationHandler());
        server.createContext("/api/user", new UserHandler());
        
        server.setExecutor(Executors.newFixedThreadPool(10));
        server.start();
        
        System.out.println("=================================================");
        System.out.println("  HydroFlow Server Started Successfully!");
        System.out.println("  Open your browser at: http://localhost:" + PORT);
        System.out.println("=================================================");
    }
    
    /**
     * Handler for serving static files (HTML, CSS, JS)
     */
    static class StaticFileHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String path = exchange.getRequestURI().getPath();
            
            // Default to index.html
            if (path.equals("/")) {
                path = "/index.html";
            }
            
            // Get file from web directory
            Path filePath = Paths.get(WEB_ROOT + path);
            
            if (Files.exists(filePath) && !Files.isDirectory(filePath)) {
                // Determine content type
                String contentType = getContentType(path);
                
                byte[] content = Files.readAllBytes(filePath);
                
                exchange.getResponseHeaders().set("Content-Type", contentType);
                exchange.sendResponseHeaders(200, content.length);
                
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(content);
                }
            } else {
                // 404 Not Found
                String response = "File not found: " + path;
                exchange.sendResponseHeaders(404, response.length());
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(response.getBytes());
                }
            }
        }
        
        private String getContentType(String path) {
            if (path.endsWith(".html")) return "text/html";
            if (path.endsWith(".css")) return "text/css";
            if (path.endsWith(".js")) return "application/javascript";
            if (path.endsWith(".json")) return "application/json";
            if (path.endsWith(".png")) return "image/png";
            if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
            if (path.endsWith(".svg")) return "image/svg+xml";
            return "application/octet-stream";
        }
    }
    
    /**
     * Handler for user login
     */
    static class LoginHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            setCorsHeaders(exchange);
            
            if ("OPTIONS".equals(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }
            
            if ("POST".equals(exchange.getRequestMethod())) {
                String body = readBody(exchange);
                Map<String, String> params = parseJson(body);
                
                String email = params.get("email");
                String password = params.get("password");
                
                UserData user = users.get(email);
                
                String response;
                int statusCode;
                
                if (user != null && user.password.equals(password)) {
                    response = String.format(
                        "{\"success\":true,\"user\":{\"firstName\":\"%s\",\"lastName\":\"%s\",\"email\":\"%s\",\"age\":\"%s\",\"weight\":\"%s\",\"activityLevel\":\"%s\"}}",
                        user.firstName, user.lastName, user.email, user.age, user.weight, user.activityLevel
                    );
                    statusCode = 200;
                } else {
                    // For demo: create a default user if none exists
                    response = "{\"success\":true,\"user\":{\"firstName\":\"Athlete\",\"lastName\":\"User\",\"email\":\"" + email + "\",\"age\":\"25\",\"weight\":\"70\",\"activityLevel\":\"moderate\"}}";
                    statusCode = 200;
                }
                
                sendJsonResponse(exchange, statusCode, response);
            } else {
                sendJsonResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
            }
        }
    }
    
    /**
     * Handler for user signup
     */
    static class SignupHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            setCorsHeaders(exchange);
            
            if ("OPTIONS".equals(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }
            
            if ("POST".equals(exchange.getRequestMethod())) {
                String body = readBody(exchange);
                Map<String, String> params = parseJson(body);
                
                String email = params.get("email");
                
                // Check if user already exists
                if (users.containsKey(email)) {
                    sendJsonResponse(exchange, 400, "{\"success\":false,\"error\":\"Email already registered\"}");
                    return;
                }
                
                // Create new user
                UserData user = new UserData();
                user.firstName = params.getOrDefault("firstName", "");
                user.lastName = params.getOrDefault("lastName", "");
                user.email = email;
                user.password = params.getOrDefault("password", "");
                user.age = params.getOrDefault("age", "25");
                user.weight = params.getOrDefault("weight", "70");
                user.activityLevel = params.getOrDefault("activityLevel", "moderate");
                
                users.put(email, user);
                
                String response = String.format(
                    "{\"success\":true,\"user\":{\"firstName\":\"%s\",\"lastName\":\"%s\",\"email\":\"%s\",\"age\":\"%s\",\"weight\":\"%s\",\"activityLevel\":\"%s\"}}",
                    user.firstName, user.lastName, user.email, user.age, user.weight, user.activityLevel
                );
                
                sendJsonResponse(exchange, 201, response);
            } else {
                sendJsonResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
            }
        }
    }
    
    /**
     * Handler for hydration data
     */
    static class HydrationHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            setCorsHeaders(exchange);
            
            if ("OPTIONS".equals(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }
            
            String method = exchange.getRequestMethod();
            String query = exchange.getRequestURI().getQuery();
            String userId = query != null && query.contains("userId=") 
                ? query.split("userId=")[1].split("&")[0] 
                : "default";
            
            if ("GET".equals(method)) {
                // Get hydration data
                HydrationData data = hydrationData.getOrDefault(userId, new HydrationData());
                String response = String.format(
                    "{\"waterIntake\":%d,\"dailyGoal\":%d,\"flowData\":[]}",
                    data.waterIntake, data.dailyGoal
                );
                sendJsonResponse(exchange, 200, response);
                
            } else if ("POST".equals(method)) {
                // Update hydration data
                String body = readBody(exchange);
                Map<String, String> params = parseJson(body);
                
                HydrationData data = hydrationData.getOrDefault(userId, new HydrationData());
                
                if (params.containsKey("waterIntake")) {
                    data.waterIntake = Integer.parseInt(params.get("waterIntake"));
                }
                if (params.containsKey("addWater")) {
                    int amount = Integer.parseInt(params.get("addWater"));
                    data.waterIntake = Math.max(0, Math.min(data.dailyGoal, data.waterIntake + amount));
                }
                
                hydrationData.put(userId, data);
                
                String response = String.format(
                    "{\"success\":true,\"waterIntake\":%d,\"dailyGoal\":%d}",
                    data.waterIntake, data.dailyGoal
                );
                sendJsonResponse(exchange, 200, response);
            } else {
                sendJsonResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
            }
        }
    }
    
    /**
     * Handler for user profile data
     */
    static class UserHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            setCorsHeaders(exchange);
            
            if ("OPTIONS".equals(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }
            
            String query = exchange.getRequestURI().getQuery();
            String email = query != null && query.contains("email=") 
                ? query.split("email=")[1].split("&")[0] 
                : null;
            
            if ("GET".equals(exchange.getRequestMethod()) && email != null) {
                UserData user = users.get(email);
                if (user != null) {
                    String response = String.format(
                        "{\"firstName\":\"%s\",\"lastName\":\"%s\",\"email\":\"%s\",\"age\":\"%s\",\"weight\":\"%s\",\"activityLevel\":\"%s\"}",
                        user.firstName, user.lastName, user.email, user.age, user.weight, user.activityLevel
                    );
                    sendJsonResponse(exchange, 200, response);
                } else {
                    sendJsonResponse(exchange, 404, "{\"error\":\"User not found\"}");
                }
            } else {
                sendJsonResponse(exchange, 400, "{\"error\":\"Missing email parameter\"}");
            }
        }
    }
    
    // Utility methods
    private static void setCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
    }
    
    private static void sendJsonResponse(HttpExchange exchange, int statusCode, String response) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        byte[] bytes = response.getBytes();
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }
    
    private static String readBody(HttpExchange exchange) throws IOException {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(exchange.getRequestBody()))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
            return sb.toString();
        }
    }
    
    private static Map<String, String> parseJson(String json) {
        Map<String, String> result = new HashMap<>();
        // Simple JSON parser for key-value pairs
        json = json.replaceAll("[{}\"]", "");
        String[] pairs = json.split(",");
        for (String pair : pairs) {
            String[] kv = pair.split(":");
            if (kv.length == 2) {
                result.put(kv[0].trim(), kv[1].trim());
            }
        }
        return result;
    }
    
    // Data classes
    static class UserData {
        String firstName;
        String lastName;
        String email;
        String password;
        String age;
        String weight;
        String activityLevel;
    }
    
    static class HydrationData {
        int waterIntake = 0;
        int dailyGoal = 1000;
    }
}