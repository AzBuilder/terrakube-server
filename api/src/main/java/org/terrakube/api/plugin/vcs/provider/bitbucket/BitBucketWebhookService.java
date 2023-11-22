package org.terrakube.api.plugin.vcs.provider.bitbucket;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.web.client.RestTemplate;
import org.springframework.stereotype.Service;
import org.terrakube.api.plugin.vcs.WebhookResult;
import org.terrakube.api.rs.workspace.Workspace;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.Map;

import javax.crypto.spec.SecretKeySpec;
import javax.crypto.Mac;

import com.fasterxml.jackson.core.JsonProcessingException;

@Service
@Slf4j
public class BitBucketWebhookService {

    private final ObjectMapper objectMapper;

    @Value("${org.terrakube.hostname}")
    private String hostname;

    public BitBucketWebhookService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public WebhookResult processWebhook(String jsonPayload, Map<String, String> headers, String token) {
        WebhookResult result = new WebhookResult();
        result.setBranch("");
        result.setVia("Bitbucket");
        try {

            log.info("verify signature for bitbucket webhook");
            result.setValid(true);
            // Verify the Bitbucket signature
            String signatureHeader = headers.get("x-hub-signature");
            if (signatureHeader == null) {
                log.error("X-Hub-Signature header is missing!");
                result.setValid(false);
                return result;
            }
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(token.getBytes(StandardCharsets.UTF_8), "HmacSHA1");
            mac.init(secretKeySpec);
            byte[] computedHash = mac.doFinal(jsonPayload.getBytes(StandardCharsets.UTF_8));
            String expectedSignature = "sha256=" + bytesToHex(computedHash);

            if (!signatureHeader.equals(expectedSignature)) {
                log.error("Request signature didn't match!");
                result.setValid(false);
                return result;
            }

            log.info("Parsing bitbucket webhook payload");

            // Extract event
            String event = headers.get("x-event-key");
            if (event != null) {
                String[] parts = event.split(":");
                if (parts.length > 1) {
                    result.setEvent(parts[1]);  // Set the second part of the split string
                } else {
                    result.setEvent(event);  // If there's no ":", set the whole event
                }
            }

            log.info("Event ",result.getEvent());


            if (result.getEvent().equals("push")) {
                // Extract branch from the changes
                JsonNode rootNode = objectMapper.readTree(jsonPayload);
                JsonNode changesNode = rootNode.path("push").path("changes").get(0);
                String ref = changesNode.path("new").path("name").asText();
                result.setBranch(ref);

                // Extract the user who triggered the webhook
                JsonNode authorNode = changesNode.path("new").path("target").path("author").path("raw");
                String author = authorNode.asText();
                result.setCreatedBy(author);
            }

        } catch (JsonProcessingException e) {
            log.info("Error processing the webhook", e);
        } catch (NoSuchAlgorithmException e) {
            log.info("Error processing the webhook", e);
        } catch (InvalidKeyException e) {
            log.info("Error parsing the secret", e);
        }
        return result;
    }

    public String createWebhook(Workspace workspace, String webhookId) {
        String url = "";
        String secret = Base64.getEncoder()
                .encodeToString(workspace.getId().toString().getBytes(StandardCharsets.UTF_8));
        String ownerAndRepo = extractOwnerAndRepo(workspace.getSource());
        String webhookUrl = String.format("https://%s/webhook/v1/%s", hostname, webhookId);
        RestTemplate restTemplate = new RestTemplate();

        // Create the headers
        HttpHeaders headers = new HttpHeaders();
        headers.set("Accept", "application/json");
        headers.set("Authorization", "Bearer " + workspace.getVcs().getAccessToken());

        // Create the body, in this version we only support push event but in future we
        // can make this more dynamic
        String body = "{\"description\":\"Terrakube\",\"url\":\"" + webhookUrl
                + "\",\"active\":true,\"events\":[\"repo:push\"],\"secret\":\"" + secret + "\"}";

        log.info(body);
        // Create the entity
        HttpEntity<String> entity = new HttpEntity<>(body, headers);
        String apiUrl = "https://api.bitbucket.org/2.0/repositories/" + ownerAndRepo + "/hooks";

        // Make the request using the Bitbucket api
        ResponseEntity<String> response = restTemplate.exchange(apiUrl
                , HttpMethod.POST, entity,
                String.class);

        // Extract the id from the response
        if (response.getStatusCodeValue() == 201) {
            ObjectMapper objectMapper = new ObjectMapper();
            try {
                JsonNode rootNode = objectMapper.readTree(response.getBody());
                url = rootNode.path("links").path("self").path("href").asText();
            } catch (Exception e) {
                log.error("Error parsing JSON response", e);
            }

            log.info("Hook created successfully {}" + url);
        }
        else {
            log.error("Error creating the webhook" + response.getBody());
        }

        return url;
    }

    private String extractOwnerAndRepo(String repoUrl) {
        try {
            URL url = new URL(repoUrl);
            String[] parts = url.getPath().split("/");
            String owner = parts[1];
            String repo = parts[2].replace(".git", "");
            return owner + "/" + repo;
        } catch (Exception e) {
            log.error("error extracing the repo", e);
            return "";
        }
    }

    private static String bytesToHex(byte[] hash) {
        StringBuilder hexString = new StringBuilder(2 * hash.length);
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }

}
