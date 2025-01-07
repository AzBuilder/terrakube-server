package org.terrakube.api;

import org.hamcrest.core.IsEqual;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockitoAnnotations;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.graphql.tester.AutoConfigureGraphQlTester;
import org.springframework.http.HttpStatus;
import org.terrakube.api.repository.TeamRepository;
import org.terrakube.api.rs.team.Team;

import java.util.UUID;

import static io.restassured.RestAssured.given;
import static org.mockito.Mockito.when;

class TfcApiTests extends ServerApplicationTests {

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
    }

    @Test
    void ping() {
        given()
                .headers("Authorization", "Bearer " + generatePAT("TERRAKUBE_DEVELOPERS"))
                .when()
                .get("/remote/tfe/v2/ping")
                .then()
                .assertThat()
                .header("TFP-API-Version", "2.5")
                .header("TFP-AppName", "Terrakube")
                .log()
                .all()
                .statusCode(HttpStatus.NOT_FOUND.value());
    }

    @Test
    void getOrgEntitlementSetWithOrgAccess() {
        given()
                .headers("Authorization", "Bearer " + generatePAT("TERRAKUBE_DEVELOPERS"))
                .when()
                .get("/remote/tfe/v2/organizations/simple/entitlement-set")
                .then()
                .assertThat()
                .body("data.attributes.operations", IsEqual.equalTo(true))
                .body("data.attributes.private-module-registry", IsEqual.equalTo(true))
                .body("data.attributes.sentinel", IsEqual.equalTo(false))
                .body("data.attributes.run-tasks", IsEqual.equalTo(false))
                .body("data.attributes.state-storage", IsEqual.equalTo(true))
                .body("data.attributes.teams", IsEqual.equalTo(false))
                .body("data.attributes.vcs-integrations", IsEqual.equalTo(true))
                .body("data.attributes.usage-reporting", IsEqual.equalTo(false))
                .body("data.attributes.user-limit", IsEqual.equalTo(5))
                .body("data.attributes.self-serve-billing", IsEqual.equalTo(true))
                .body("data.attributes.audit-logging", IsEqual.equalTo(false))
                .body("data.attributes.agents", IsEqual.equalTo(false))
                .body("data.attributes.sso", IsEqual.equalTo(false))
                .log()
                .all()
                .statusCode(HttpStatus.OK.value());
    }

    @Test
    void getOrgEntitlementSetWithoutOrgAccess() {
        given()
                .headers("Authorization", "Bearer " + generatePAT("INVALID_GROUP"))
                .when()
                .get("/remote/tfe/v2/organizations/simple/entitlement-set")
                .then()
                .assertThat()
                .log()
                .all()
                .statusCode(HttpStatus.NOT_FOUND.value());
    }

    @Test
    void getOrgCapacity() {
        given()
                .headers("Authorization", "Bearer " + generatePAT("TERRAKUBE_DEVELOPERS"))
                .when()
                .get("/remote/tfe/v2/organizations/simple/capacity")
                .then()
                .assertThat()
                .log()
                .all()
                .statusCode(HttpStatus.OK.value());
    }

    @Test
    void getOrgInformation() {
        given()
                .headers("Authorization", "Bearer " + generatePAT("TERRAKUBE_DEVELOPERS"))
                .when()
                .get("/remote/tfe/v2/organizations/simple")
                .then()
                .assertThat()
                .body("data.attributes.name", IsEqual.equalTo("simple"))
                .body("data.attributes.permissions.can-update", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-destroy", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-access-via-teams", IsEqual.equalTo(false))
                .body("data.attributes.permissions.can-create-module", IsEqual.equalTo(false))
                .body("data.attributes.permissions.can-create-team", IsEqual.equalTo(false))
                .body("data.attributes.permissions.can-create-workspace", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-manage-users", IsEqual.equalTo(false))
                .body("data.attributes.permissions.can-manage-subscription", IsEqual.equalTo(false))
                .body("data.attributes.permissions.can-manage-sso", IsEqual.equalTo(false))
                .body("data.attributes.permissions.can-update-oauth", IsEqual.equalTo(false))
                .body("data.attributes.permissions.can-update-sentinel", IsEqual.equalTo(false))
                .body("data.attributes.permissions.can-update-ssh-keys", IsEqual.equalTo(false))
                .body("data.attributes.permissions.can-update-api-token", IsEqual.equalTo(false))
                .body("data.attributes.permissions.can-traverse", IsEqual.equalTo(false))
                .body("data.attributes.permissions.can-start-trial", IsEqual.equalTo(false))
                .body("data.attributes.permissions.can-update-agent-pools", IsEqual.equalTo(false))
                .body("data.attributes.permissions.can-manage-tags", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-manage-public-modules", IsEqual.equalTo(false))
                .body("data.attributes.permissions.can-manage-public-providers", IsEqual.equalTo(false))
                .body("data.attributes.permissions.can-manage-run-tasks", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-read-run-tasks", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-create-provider", IsEqual.equalTo(false))
                .log()
                .all()
                .statusCode(HttpStatus.OK.value());
    }

    @Test
    void getOrgInformationInvalidUser() {
        given()
                .headers("Authorization", "Bearer " + generatePAT("INVALID_GROUP"))
                .when()
                .get("/remote/tfe/v2/organizations/simple")
                .then()
                .assertThat()
                .log()
                .all()
                .statusCode(HttpStatus.NOT_FOUND.value());
    }

    @Test
    void getWorkspace() {
        Team team = teamRepository.findById(UUID.fromString("58529721-425e-44d7-8b0d-1d515043c2f7")).get();
        team.setManageJob(true);
        teamRepository.save(team);

        given()
                .headers("Authorization", "Bearer " + generatePAT("TERRAKUBE_DEVELOPERS"))
                .when()
                .get("/remote/tfe/v2/organizations/simple/workspaces/sample_simple")
                .then()
                .assertThat()
                .body("data.attributes.name", IsEqual.equalTo("sample_simple"))
                .body("data.attributes.locked", IsEqual.equalTo(false))
                .body("data.attributes.terraform-version", IsEqual.equalTo("1.2.5"))
                .body("data.attributes.auto-apply", IsEqual.equalTo(false))
                .body("data.attributes.execution-mode", IsEqual.equalTo("remote"))
                .body("data.attributes.global-remote-state", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-create-state-versions", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-destroy", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-lock", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-manage-run-tasks", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-manage-tags", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-queue-apply", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-queue-destroy", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-queue-run", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-read-settings", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-read-state-versions", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-read-variable", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-unlock", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-update", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-update-variable", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-read-assessment-result", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-force-delete", IsEqual.equalTo(true))
                .log()
                .all()
                .statusCode(HttpStatus.OK.value());

        team = teamRepository.findById(UUID.fromString("58529721-425e-44d7-8b0d-1d515043c2f7")).get();
        team.setManageJob(false);
        teamRepository.save(team);
    }

    @Test
    void getRunEvents() {
        given()
                .headers("Authorization", "Bearer " + generatePAT("TERRAKUBE_DEVELOPERS"))
                .when()
                .get("/remote/tfe/v2/runs/1/run-events")
                .then()
                .assertThat()
                .log()
                .all()
                .statusCode(HttpStatus.OK.value());
    }

    @Test
    void getWorkspaceStateConsumers() {
        given()
                .headers("Authorization", "Bearer " + generatePAT("TERRAKUBE_DEVELOPERS"))
                .when()
                .get("/remote/tfe/v2/workspaces/5ed411ca-7ab8-4d2f-b591-02d0d5788afc/relationships/remote-state-consumers")
                .then()
                .assertThat()
                .log()
                .all()
                .statusCode(HttpStatus.OK.value());
    }

    @Test
    void lockWorkspace() {
        Team team = teamRepository.findById(UUID.fromString("58529721-425e-44d7-8b0d-1d515043c2f7")).get();
        team.setManageJob(true);
        teamRepository.save(team);

        given()
                .headers("Authorization", "Bearer " + generatePAT("TERRAKUBE_DEVELOPERS"))
                .when()
                .post("/remote/tfe/v2/workspaces/5ed411ca-7ab8-4d2f-b591-02d0d5788afc/actions/lock")
                .then()
                .assertThat()
                .body("data.attributes.name", IsEqual.equalTo("sample_simple"))
                .body("data.attributes.locked", IsEqual.equalTo(true))
                .body("data.attributes.terraform-version", IsEqual.equalTo("1.2.5"))
                .body("data.attributes.auto-apply", IsEqual.equalTo(false))
                .body("data.attributes.execution-mode", IsEqual.equalTo("remote"))
                .body("data.attributes.global-remote-state", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-create-state-versions", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-destroy", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-lock", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-manage-run-tasks", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-manage-tags", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-queue-apply", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-queue-destroy", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-queue-run", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-read-settings", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-read-state-versions", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-read-variable", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-unlock", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-update", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-update-variable", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-read-assessment-result", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-force-delete", IsEqual.equalTo(true))
                .log()
                .all()
                .statusCode(HttpStatus.OK.value());

        given()
                .headers("Authorization", "Bearer " + generatePAT("TERRAKUBE_DEVELOPERS"))
                .when()
                .post("/remote/tfe/v2/workspaces/5ed411ca-7ab8-4d2f-b591-02d0d5788afc/actions/lock")
                .then()
                .assertThat()
                .log()
                .all()
                .statusCode(HttpStatus.CONFLICT.value());

        team = teamRepository.findById(UUID.fromString("58529721-425e-44d7-8b0d-1d515043c2f7")).get();
        team.setManageJob(false);
        teamRepository.save(team);
    }

    @Test
    void unlockWorkspace() {
        Team team = teamRepository.findById(UUID.fromString("58529721-425e-44d7-8b0d-1d515043c2f7")).get();
        team.setManageJob(true);
        teamRepository.save(team);

        given()
                .headers("Authorization", "Bearer " + generatePAT("TERRAKUBE_DEVELOPERS"))
                .when()
                .post("/remote/tfe/v2/workspaces/5ed411ca-7ab8-4d2f-b591-02d0d5788afc/actions/unlock")
                .then()
                .assertThat()
                .body("data.attributes.name", IsEqual.equalTo("sample_simple"))
                .body("data.attributes.locked", IsEqual.equalTo(false))
                .body("data.attributes.terraform-version", IsEqual.equalTo("1.2.5"))
                .body("data.attributes.auto-apply", IsEqual.equalTo(false))
                .body("data.attributes.execution-mode", IsEqual.equalTo("remote"))
                .body("data.attributes.global-remote-state", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-create-state-versions", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-destroy", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-lock", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-manage-run-tasks", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-manage-tags", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-queue-apply", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-queue-destroy", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-queue-run", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-read-settings", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-read-state-versions", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-read-variable", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-unlock", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-update", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-update-variable", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-read-assessment-result", IsEqual.equalTo(true))
                .body("data.attributes.permissions.can-force-delete", IsEqual.equalTo(true))
                .log()
                .all()
                .statusCode(HttpStatus.OK.value());

        team = teamRepository.findById(UUID.fromString("58529721-425e-44d7-8b0d-1d515043c2f7")).get();
        team.setManageJob(false);
        teamRepository.save(team);
    }
}
