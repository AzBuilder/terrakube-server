package org.terrakube.api.rs.checks.job;

import com.yahoo.elide.annotation.SecurityCheck;
import com.yahoo.elide.core.security.ChangeSpec;
import com.yahoo.elide.core.security.RequestScope;
import com.yahoo.elide.core.security.checks.OperationCheck;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.terrakube.api.plugin.security.user.AuthenticatedUser;
import org.terrakube.api.rs.checks.membership.MembershipService;
import org.terrakube.api.rs.job.Job;
import org.terrakube.api.rs.team.Team;
import org.terrakube.api.rs.workspace.access.Access;

import java.util.List;
import java.util.Optional;

@Slf4j
@SecurityCheck(TeamLimitedViewJob.RULE)
public class TeamLimitedViewJob extends OperationCheck<Job> {
    public static final String RULE = "team limited view job";

    @Autowired
    MembershipService membershipService;

    @Autowired
    AuthenticatedUser authenticatedUser;

    @Override
    public boolean ok(Job job, RequestScope requestScope, Optional<ChangeSpec> optional) {
        log.debug("team view job {}", job.getId());
        List<Access> teamLimitedList = job.getWorkspace().getAccess();
        return authenticatedUser.isSuperUser(requestScope.getUser()) ? true : membershipService.checkLimitedMembership(requestScope.getUser(), teamLimitedList);

    }
}
