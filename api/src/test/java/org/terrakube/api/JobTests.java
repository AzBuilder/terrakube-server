package org.terrakube.api;

import org.hamcrest.core.IsEqual;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockitoAnnotations;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.graphql.tester.AutoConfigureGraphQlTester;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.terrakube.api.repository.TeamRepository;
import org.terrakube.api.rs.job.Job;
import org.terrakube.api.rs.team.Team;
import org.terrakube.api.rs.workspace.Workspace;

import java.util.List;
import java.util.UUID;

import static io.restassured.RestAssured.given;
import static org.mockito.Mockito.when;
import static org.mockserver.model.HttpRequest.request;
import static org.mockserver.model.HttpResponse.response;

class JobTests extends ServerApplicationTests {

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
    }

    @Test
    void createJobAsOrgMember() {
        mockServer.reset();
        mockServer.when(
                request()
                        .withMethod(HttpMethod.POST.name())
                        .withPath("/api/v1/terraform-rs")
        ).respond(
                response().withStatusCode(HttpStatus.ACCEPTED.value()).withBody("")
        );

        Team team = teamRepository.findById(UUID.fromString("58529721-425e-44d7-8b0d-1d515043c2f7")).get();
        team.setManageJob(true);
        teamRepository.save(team);

        given()
                .headers("Authorization", "Bearer " + generatePAT("TERRAKUBE_DEVELOPERS"), "Content-Type", "application/vnd.api+json")
                .body("{\n" +
                        "  \"data\": {\n" +
                        "    \"type\": \"job\",\n" +
                        "    \"attributes\": {\n" +
                        "      \"templateReference\": \"2db36f7c-f549-4341-a789-315d47eb061d\"\n" +
                        "    },\n" +
                        "    \"relationships\":{\n" +
                        "        \"workspace\":{\n" +
                        "            \"data\":{\n" +
                        "                \"type\": \"workspace\",\n" +
                        "                \"id\": \"5ed411ca-7ab8-4d2f-b591-02d0d5788afc\"\n" +
                        "            }\n" +
                        "        }\n" +
                        "    }\n" +
                        "  }\n" +
                        "}")
                .when()
                .post("/api/v1/organization/d9b58bd3-f3fc-4056-a026-1163297e80a8/job/")
                .then()
                .assertThat()
                .body("data.attributes.templateReference", IsEqual.equalTo("2db36f7c-f549-4341-a789-315d47eb061d"))
                .log()
                .all()
                .statusCode(HttpStatus.CREATED.value());

        team = teamRepository.findById(UUID.fromString("58529721-425e-44d7-8b0d-1d515043c2f7")).get();
        team.setManageJob(false);
        teamRepository.save(team);
    }

    @Test
    void createJobLockedWorkspace() {
        mockServer.reset();
        mockServer.when(
                request()
                        .withMethod(HttpMethod.POST.name())
                        .withPath("/api/v1/terraform-rs")
        ).respond(
                response().withStatusCode(HttpStatus.ACCEPTED.value()).withBody("")
        );

        Team team = teamRepository.findById(UUID.fromString("58529721-425e-44d7-8b0d-1d515043c2f7")).get();
        team.setManageJob(true);
        teamRepository.save(team);

        given()
                .headers("Authorization", "Bearer " + generatePAT("TERRAKUBE_DEVELOPERS"), "Content-Type", "application/vnd.api+json")
                .body("{\n" +
                        "  \"data\": {\n" +
                        "    \"type\": \"workspace\",\n" +
                        "    \"id\": \"5ed411ca-7ab8-4d2f-b591-02d0d5788afc\",\n" +
                        "    \"attributes\": {\n" +
                        "      \"locked\": \"true\"\n" +
                        "    }\n" +
                        "  }\n" +
                        "}")
                .when()
                .patch("/api/v1/organization/d9b58bd3-f3fc-4056-a026-1163297e80a8/workspace/5ed411ca-7ab8-4d2f-b591-02d0d5788afc")
                .then()
                .assertThat()
                .log()
                .all()
                .statusCode(HttpStatus.NO_CONTENT.value());

        given()
                .headers("Authorization", "Bearer " + generatePAT("TERRAKUBE_DEVELOPERS"), "Content-Type", "application/vnd.api+json")
                .body("{\n" +
                        "  \"data\": {\n" +
                        "    \"type\": \"job\",\n" +
                        "    \"attributes\": {\n" +
                        "      \"templateReference\": \"2db36f7c-f549-4341-a789-315d47eb061d\"\n" +
                        "    },\n" +
                        "    \"relationships\":{\n" +
                        "        \"workspace\":{\n" +
                        "            \"data\":{\n" +
                        "                \"type\": \"workspace\",\n" +
                        "                \"id\": \"5ed411ca-7ab8-4d2f-b591-02d0d5788afc\"\n" +
                        "            }\n" +
                        "        }\n" +
                        "    }\n" +
                        "  }\n" +
                        "}")
                .when()
                .post("/api/v1/organization/d9b58bd3-f3fc-4056-a026-1163297e80a8/job")
                .then()
                .assertThat()
                .log()
                .all()
                .statusCode(HttpStatus.CREATED.value());

        given()
                .headers("Authorization", "Bearer " + generatePAT("TERRAKUBE_DEVELOPERS"), "Content-Type", "application/vnd.api+json")
                .body("{\n" +
                        "  \"data\": {\n" +
                        "    \"type\": \"workspace\",\n" +
                        "    \"id\": \"5ed411ca-7ab8-4d2f-b591-02d0d5788afc\",\n" +
                        "    \"attributes\": {\n" +
                        "      \"locked\": \"false\"\n" +
                        "    }\n" +
                        "  }\n" +
                        "}")
                .when()
                .patch("/api/v1/organization/d9b58bd3-f3fc-4056-a026-1163297e80a8/workspace/5ed411ca-7ab8-4d2f-b591-02d0d5788afc")
                .then()
                .assertThat()
                .log()
                .all()
                .statusCode(HttpStatus.NO_CONTENT.value());

        team = teamRepository.findById(UUID.fromString("58529721-425e-44d7-8b0d-1d515043c2f7")).get();
        team.setManageJob(false);
        teamRepository.save(team);
    }

}
