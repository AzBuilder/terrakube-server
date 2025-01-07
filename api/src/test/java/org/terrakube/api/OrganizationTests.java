package org.terrakube.api;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;

import static io.restassured.RestAssured.given;
import static org.hamcrest.core.IsEqual.equalTo;
import static org.mockito.Mockito.when;

class OrganizationTests extends ServerApplicationTests {

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
    }

    @Test
    void searchOrganizationAsAdmin() {
        given()
                .headers("Authorization", "Bearer " + generatePAT("TERRAKUBE_ADMIN")).when()
                .get("/api/v1/organization/d9b58bd3-f3fc-4056-a026-1163297e80a8")
                .then()
                .assertThat().body("data.attributes.name", equalTo("simple"))
                .log()
                .all()
                .statusCode(HttpStatus.OK.value());
    }

    @Test
    void createOrganizationAsAdmin() {
        given()
                .headers("Authorization", "Bearer " + generatePAT("TERRAKUBE_ADMIN"), "Content-Type", "application/vnd.api+json")
                .body("{\n" +
                        "  \"data\": {\n" +
                        "    \"type\": \"organization\",\n" +
                        "    \"attributes\": {\n" +
                        "      \"name\": \"Terrakube\",\n" +
                        "      \"description\": \"Terrakube organization\"\n" +
                        "    }\n" +
                        "  }\n" +
                        "}")
                .when()
                .post("/api/v1/organization/")
                .then()
                .assertThat().body("data.attributes.name", equalTo("Terrakube"))
                .log()
                .all()
                .statusCode(HttpStatus.CREATED.value());
    }

    @Test
    void searchOrganizationAsNonMember() {
        given()
                .headers("Authorization", "Bearer " + generatePAT("FAKE_ADMIN")).when()
                .get("/api/v1/organization/d9b58bd3-f3fc-4056-a026-1163297e80a8")
                .then()
                .log()
                .all()
                .statusCode(HttpStatus.FORBIDDEN.value());
    }

    @Test
    void searchOrganizationInvalidToken() {
        given()
                .headers("Authorization", "Bearer ").when()
                .when()
                .get("/api/v1/organization/d9b58bd3-f3fc-4056-a026-1163297e80a8")
                .then()
                .log()
                .all()
                .statusCode(HttpStatus.UNAUTHORIZED.value());
    }

}
