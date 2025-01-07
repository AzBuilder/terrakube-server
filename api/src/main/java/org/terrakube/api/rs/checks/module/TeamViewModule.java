package org.terrakube.api.rs.checks.module;

import com.yahoo.elide.annotation.SecurityCheck;
import com.yahoo.elide.core.security.ChangeSpec;
import com.yahoo.elide.core.security.RequestScope;
import com.yahoo.elide.core.security.checks.OperationCheck;
import lombok.extern.slf4j.Slf4j;
import org.terrakube.api.plugin.security.groups.GroupService;
import org.terrakube.api.plugin.security.user.AuthenticatedUser;
import org.terrakube.api.rs.checks.membership.MembershipService;
import org.terrakube.api.rs.module.Module;
import org.terrakube.api.rs.team.Team;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.Optional;

@Slf4j
@SecurityCheck(TeamViewModule.RULE)
public class TeamViewModule extends OperationCheck<Module> {

    public static final String RULE = "team view module";

    @Autowired
    AuthenticatedUser authenticatedUser;

    @Autowired
    MembershipService membershipService;

    @Autowired
    GroupService groupService;

    @Override
    public boolean ok(Module module, RequestScope requestScope, Optional<ChangeSpec> optional) {
        log.debug("team view module {}", module.getId());
        List<Team> teamList = module.getOrganization().getTeam();
        if (authenticatedUser.isSuperUser(requestScope.getUser())) {
            return true;
        } else if (membershipService.checkMembership(requestScope.getUser(), teamList)) {
            return true;
        } else return groupService.isMemberWithLimitedAccessV2(requestScope.getUser(), module.getOrganization());
    }
}
