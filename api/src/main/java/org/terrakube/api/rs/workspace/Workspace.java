package org.terrakube.api.rs.workspace;

import java.sql.Types;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.SQLRestriction;
import org.terrakube.api.plugin.security.audit.GenericAuditFields;
import org.terrakube.api.rs.IdConverter;
import org.terrakube.api.rs.Organization;
import org.terrakube.api.rs.agent.Agent;
import org.terrakube.api.rs.collection.Reference;
import org.terrakube.api.rs.hooks.workspace.WorkspaceManageHook;
import org.terrakube.api.rs.job.Job;
import org.terrakube.api.rs.ssh.Ssh;
import org.terrakube.api.rs.vcs.Vcs;
import org.terrakube.api.rs.webhook.Webhook;
import org.terrakube.api.rs.workspace.access.Access;
import org.terrakube.api.rs.workspace.content.Content;
import org.terrakube.api.rs.workspace.history.History;
import org.terrakube.api.rs.workspace.parameters.Variable;
import org.terrakube.api.rs.workspace.schedule.Schedule;
import org.terrakube.api.rs.workspace.tag.WorkspaceTag;

import com.yahoo.elide.annotation.CreatePermission;
import com.yahoo.elide.annotation.DeletePermission;
import com.yahoo.elide.annotation.Exclude;
import com.yahoo.elide.annotation.Include;
import com.yahoo.elide.annotation.LifeCycleHookBinding;
import com.yahoo.elide.annotation.ReadPermission;
import com.yahoo.elide.annotation.UpdatePermission;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import lombok.Getter;
import lombok.Setter;

@ReadPermission(expression = "team view workspace OR team limited view workspace")
@CreatePermission(expression = "team manage workspace")
@UpdatePermission(expression = "team manage workspace OR team limited manage workspace")
@DeletePermission(expression = "team manage workspace")
@LifeCycleHookBinding(operation = LifeCycleHookBinding.Operation.UPDATE, phase = LifeCycleHookBinding.TransactionPhase.PRECOMMIT, hook = WorkspaceManageHook.class)
@LifeCycleHookBinding(operation = LifeCycleHookBinding.Operation.CREATE, phase = LifeCycleHookBinding.TransactionPhase.PRECOMMIT, hook = WorkspaceManageHook.class)
@Include
@Getter
@Setter
@Entity(name = "workspace")
@SQLRestriction(value = "deleted = false")
public class Workspace extends GenericAuditFields {

    @Id
    @JdbcTypeCode(Types.VARCHAR)
    @Convert(converter = IdConverter.class)
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "name")
    private String name;

    @Column(name = "description")
    private String description;

    @Column(name = "source")
    private String source;

    @Column(name = "branch")
    private String branch;

    @Column(name = "folder")
    private String folder;

    @Column(name = "locked")
    private boolean locked;

    @Column(name = "deleted")
    private boolean deleted;

    @Column(name = "default_template")
    private String defaultTemplate;

    @Column(name = "lock_description")
    private String lockDescription;

    @Column(name = "iac_type")
    private String iacType = "terraform";

    @Column(name = "module_ssh_key")
    private String moduleSshKey;

    @Column(name = "terraform_version")
    private String terraformVersion;

    @Column(name = "execution_mode")
    private String executionMode;

    @ManyToOne
    private Organization organization;

    @OneToMany(mappedBy = "workspace")
    private List<Variable> variable;

    @UpdatePermission(expression = "user is a super service")
    @OneToMany(mappedBy = "workspace")
    private List<History> history;

    @OneToMany(mappedBy = "workspace")
    private List<Schedule> schedule;

    @OneToMany(mappedBy = "workspace")
    @UpdatePermission(expression = "team view workspace OR team limited view workspace")
    private List<Job> job;

    @Exclude
    @OneToMany(mappedBy = "workspace")
    private List<Content> content;

    @OneToMany(mappedBy = "workspace")
    private List<WorkspaceTag> workspaceTag;

    @ManyToOne
    private Vcs vcs;

    @OneToOne
    private Ssh ssh;

    @OneToOne
    private Agent agent;
    
    @OneToMany(mappedBy = "workspace", fetch = FetchType.LAZY)
    private List<Webhook> webhook;

    @OneToMany(mappedBy = "workspace", fetch = FetchType.LAZY)
    private List<Reference> reference;

    @OneToMany(mappedBy = "workspace")
    @UpdatePermission(expression = "user is a superuser")
    private List<Access> access;
}
