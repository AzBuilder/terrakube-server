package org.terrakube.api.rs.checks.job;

import com.yahoo.elide.annotation.SecurityCheck;
import com.yahoo.elide.core.security.ChangeSpec;
import com.yahoo.elide.core.security.RequestScope;
import com.yahoo.elide.core.security.checks.OperationCheck;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.terrakube.api.plugin.security.groups.GroupService;
import org.terrakube.api.plugin.security.user.AuthenticatedUser;
import org.terrakube.api.rs.job.Job;
import org.terrakube.api.rs.team.Team;
import org.terrakube.api.rs.workspace.access.Access;

import java.util.List;
import java.util.Optional;

@Slf4j
@SecurityCheck(TeamLimitedManageJob.RULE)
public class TeamLimitedManageJob extends OperationCheck<Job> {
    public static final String RULE = "team limited manage job";

    @Autowired
    AuthenticatedUser authenticatedUser;

    @Autowired
    GroupService groupService;

    @Override
    public boolean ok(Job job, RequestScope requestScope, Optional<ChangeSpec> optional) {
        log.debug("team limited manage job {}", job.getId());
        List<Access> teamList = job.getWorkspace().getAccess();
        boolean isServiceAccount = authenticatedUser.isServiceAccount(requestScope.getUser());
        if (!teamList.isEmpty())
            for (Access team : teamList) {
                if (isServiceAccount) {
                    if (groupService.isServiceMember(requestScope.getUser(), team.getName()) && team.isManageJob()) {
                        return true;
                    }
                } else {
                    if (groupService.isMember(requestScope.getUser(), team.getName()) && team.isManageJob())
                        return true;
                }
            }
        return false;
    }
}
