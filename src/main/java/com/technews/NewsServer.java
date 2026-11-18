package com.technews;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * سرور ساده جاوا برای سایت تک نیوز.
 * بدون هیچ وابستگی خارجی: فقط JDK معمولی لازم است.
 *
 *Endpoint ها:
 *   GET  /api/news                 لیست تمام اخبار
 *   GET  /api/news?category=...    فیلتر بر اساس دسته بندی
 *   GET  /api/news/{id}            یک خبر خاص
 *   GET  /api/categories           لیست دسته بندیها
 *   POST /api/newsletter           ثبت ایمیل خبرنامه
 *   GET  /*                        فایلهای استاتیک سایت
 */
public class NewsServer {

    private static Path root;
    private static String newsJson = "[]";

    private static final String CATEGORIES_JSON =
            "[\"همه\", \"هوش مصنوعی\", \"سخت افزار\", \"موبایل\", \"امنیت\", \"نرم افزار\", \"کوانتوم\"]";

    public static void main(String[] args) throws Exception {
        root = Paths.get(System.getProperty("technews.root", ".")).toAbsolutePath().normalize();

        Path dataFile = root.resolve("data").resolve("news.json");
        if (Files.exists(dataFile)) {
            newsJson = new String(Files.readAllBytes(dataFile), StandardCharsets.UTF_8);
        }

        int port = 8080;
        if (args.length > 0) {
            try { port = Integer.parseInt(args[0]); } catch (NumberFormatException ignored) { }
        }
        String envPort = System.getenv("PORT");
        if (envPort != null) {
            try { port = Integer.parseInt(envPort); } catch (NumberFormatException ignored) { }
        }

        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        server.createContext("/api/news", NewsServer::handleNews);
        server.createContext("/api/categories", exchange -> sendJson(exchange, 200, CATEGORIES_JSON));
        server.createContext("/api/newsletter", NewsServer::handleNewsletter);
        server.createContext("/", NewsServer::serveStatic);
        server.setExecutor(Executors.newFixedThreadPool(8));
        server.start();

        System.out.println("TechNews server is running at http://localhost:" + port);
        System.out.println("Static files root: " + root);
        System.out.println("Press Ctrl+C to stop.");
    }

    /* ---------------- API: اخبار ---------------- */
    private static void handleNews(HttpExchange exchange) throws IOException {
        if ("OPTIONS".equals(exchange.getRequestMethod())) {
            sendOptions(exchange);
            return;
        }

        String path = exchange.getRequestURI().getPath();
        String query = exchange.getRequestURI().getQuery();
        String result = newsJson;

        if (!path.equals("/api/news") && path.startsWith("/api/news/")) {
            String id = path.substring("/api/news/".length()).trim();
            String item = findById(id);
            if (item == null) {
                sendJson(exchange, 404, "{\"error\":\"خبری با این شناسه پیدا نشد\"}");
                return;
            }
            result = item;
        } else if (query != null && query.contains("category=")) {
            String category = query.substring(query.indexOf("category=") + "category=".length());
            int amp = category.indexOf('&');
            if (amp >= 0) category = category.substring(0, amp);
            result = filterByCategory(URLDecoder.decode(category, "UTF-8"));
        }

        sendJson(exchange, 200, result);
    }

    private static String findById(String id) {
        Pattern pattern = Pattern.compile("\"id\"\\s*:\\s*\"" + Pattern.quote(id) + "\"");
        Matcher matcher = pattern.matcher(newsJson);
        if (!matcher.find()) return null;
        int start = newsJson.lastIndexOf('{', matcher.start());
        int end = newsJson.indexOf('}', matcher.end());
        if (start < 0 || end < 0) return null;
        return newsJson.substring(start, end + 1);
    }

    private static String filterByCategory(String category) {
        StringBuilder sb = new StringBuilder("[\n");
        String needle = "\"category\": \"" + category + "\"";
        for (String line : newsJson.split("\\R")) {
            if (line.contains(needle)) {
                String clean = line.trim();
                if (clean.endsWith(",")) clean = clean.substring(0, clean.length() - 1);
                if (sb.length() > 2) sb.append(",\n");
                sb.append(clean);
            }
        }
        sb.append("\n]");
        return sb.toString();
    }

    /* ---------------- API: خبرنامه ---------------- */
    private static void handleNewsletter(HttpExchange exchange) throws IOException {
        if ("OPTIONS".equals(exchange.getRequestMethod())) {
            sendOptions(exchange);
            return;
        }

        String body = new String(readAll(exchange.getRequestBody()), StandardCharsets.UTF_8);
        Matcher matcher = Pattern.compile("\"email\"\\s*:\\s*\"([^\"]+)\"").matcher(body);
        String email = matcher.find() ? matcher.group(1) : "";
        boolean ok = email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

        String json = ok
                ? "{\"ok\":true,\"message\":\"اشتراک شما با موفقیت ثبت شد\"}"
                : "{\"ok\":false,\"message\":\"لطفاً یک ایمیل معتبر وارد کنید\"}";
        sendJson(exchange, ok ? 200 : 400, json);
    }

    /* ---------------- فایلهای استاتیک ---------------- */
    private static void serveStatic(HttpExchange exchange) throws IOException {
        if ("OPTIONS".equals(exchange.getRequestMethod())) {
            sendOptions(exchange);
            return;
        }

        String path = exchange.getRequestURI().getPath();
        if (path.equals("/") || path.isEmpty()) path = "/index.html";

        Path file = root.resolve(path.startsWith("/") ? path.substring(1) : path).normalize();
        if (!file.startsWith(root) || !Files.isRegularFile(file)) {
            sendJson(exchange, 404, "{\"error\":\"فایل مورد نظر پیدا نشد\"}");
            return;
        }

        byte[] bytes = Files.readAllBytes(file);
        applyCors(exchange);
        exchange.getResponseHeaders().set("Content-Type", contentType(file.getFileName().toString()));
        exchange.sendResponseHeaders(200, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    /* ---------------- کمکرسانها ---------------- */
    private static void sendJson(HttpExchange exchange, int status, String json) throws IOException {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        applyCors(exchange);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        exchange.sendResponseHeaders(status, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static void sendOptions(HttpExchange exchange) throws IOException {
        applyCors(exchange);
        exchange.sendResponseHeaders(204, -1);
        exchange.close();
    }

    private static void applyCors(HttpExchange exchange) {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
    }

    private static byte[] readAll(InputStream in) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buffer = new byte[4096];
        int read;
        while ((read = in.read(buffer)) != -1) {
            out.write(buffer, 0, read);
        }
        return out.toByteArray();
    }

    private static String contentType(String fileName) {
        String name = fileName.toLowerCase();
        if (name.endsWith(".html") || name.endsWith(".htm")) return "text/html; charset=utf-8";
        if (name.endsWith(".css")) return "text/css; charset=utf-8";
        if (name.endsWith(".js")) return "text/javascript; charset=utf-8";
        if (name.endsWith(".json")) return "application/json; charset=utf-8";
        if (name.endsWith(".svg")) return "image/svg+xml";
        if (name.endsWith(".png")) return "image/png";
        if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
        if (name.endsWith(".gif")) return "image/gif";
        if (name.endsWith(".ico")) return "image/x-icon";
        return "application/octet-stream";
    }
}
