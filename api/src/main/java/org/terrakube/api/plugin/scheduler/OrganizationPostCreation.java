package org.terrakube.api.plugin.scheduler;

import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.terrakube.api.plugin.manage.OrganizationManageService;
import org.terrakube.api.repository.OrganizationRepository;
import org.terrakube.api.rs.Organization;

import java.util.Optional;
import java.util.UUID;

public class OrganizationPostCreation implements org.quartz.Job {

    OrganizationRepository organizationRepository;

    OrganizationManageService organizationManageService;

    public OrganizationPostCreation(OrganizationRepository organizationRepository, OrganizationManageService organizationManageService) {
        this.organizationRepository = organizationRepository;
        this.organizationManageService = organizationManageService;
    }

    @Override
    public void execute(JobExecutionContext jobExecutionContext) throws JobExecutionException {
        String organizationId = jobExecutionContext.getJobDetail().getJobDataMap().getString("organizationId");
        Optional<Organization> organization = organizationRepository.findById(UUID.fromString(organizationId));
        organization.ifPresent(org -> organizationManageService.postCreationSetup(org));
    }
}
