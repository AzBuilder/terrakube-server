package org.terrakube.api;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.restassured.RestAssured;
import net.minidev.json.JSONArray;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.TestInstance;
import org.mockito.Mock;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.terrakube.api.plugin.scheduler.job.tcl.executor.ExecutorService;
import org.mockserver.integration.ClientAndServer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;
import org.terrakube.api.plugin.token.pat.PatService;
import org.terrakube.api.plugin.scheduler.job.tcl.TclService;
import org.terrakube.api.repository.*;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.mockito.Mockito.when;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@ActiveProfiles("test")
class ServerApplicationTests {

    @MockBean
    protected RedisTemplate<String, Object> redisTemplate;

    @Mock
    protected ValueOperations<String, Object> valueOperations;

    ClientAndServer mockServer;

    @LocalServerPort
    int port;

    @Autowired
    JobRepository jobRepository;

    @Autowired
    StepRepository stepRepository;

    @Autowired
    WorkspaceRepository workspaceRepository;

    @Autowired
    OrganizationRepository organizationRepository;

    @Autowired
    TemplateRepository templateRepository;

    @Autowired
    ExecutorService executorService;

    @Autowired
    AgentRepository agentRepository;

    @Autowired
    TeamRepository teamRepository;

    @Value("${org.terrakube.token.pat}")
    private String base64Key;

    @Value("${org.terrakube.token.internal}")
    private String base64KeyInternal;

    @Autowired
    PatService patService;

    @Autowired
    TclService tclService;

    private static final String ISSUER = "Terrakube";
    private static final String ISSUER_INTERNAL = "TerrakubeInternal";

    @BeforeAll
    public void setUp() {
        RestAssured.port = port;
        mockServer = mockServer.startClientAndServer(9999);
    }

    @AfterAll
    public void stopServer() {
        mockServer.stop();
        while (!mockServer.hasStopped(10,100L, TimeUnit.MILLISECONDS)){}
    }

    public String generatePAT(String... activeGroups) {
        JSONArray groups = new JSONArray();
        for (String group : activeGroups)
            groups.appendElement(group);

        String jws = patService.createToken(
                1,
                "Terrakube Test",
                "Terrakube Test",
                "test@terrakube.org",
                groups
        );
        return jws;
    }

    public String generateSystemToken() {
        SecretKey key = Keys.hmacShaKeyFor(Decoders.BASE64URL.decode(this.base64KeyInternal));

        String jws = Jwts.builder()
                .setIssuer(ISSUER_INTERNAL)
                .setSubject(String.format("%s (Token)", "Terrakube Test"))
                .setAudience(ISSUER_INTERNAL)
                .setId(UUID.randomUUID().toString())
                .claim("email", "test@terrakube.com")
                .claim("email_verified", true)
                .claim("name", "Terrakube Test")
                .setIssuedAt(Date.from(Instant.now()))
                .setExpiration(Date.from(Instant.now().plus(1, ChronoUnit.DAYS)))
                .signWith(key)
                .compact();

        return jws;
    }

}
