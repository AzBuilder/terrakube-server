package org.terrakube.api.plugin.manage;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.quartz.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.terrakube.api.plugin.scheduler.OrganizationPostCreation;
import org.terrakube.api.plugin.scheduler.ScheduleJob;
import org.terrakube.api.repository.OrganizationRepository;
import org.terrakube.api.repository.TemplateRepository;
import org.terrakube.api.rs.Organization;
import org.terrakube.api.rs.template.Template;

import java.util.Base64;
import java.util.UUID;

@AllArgsConstructor
@Service
@Slf4j
public class OrganizationManageService {

        private static final String PREFIX_JOB_CONTEXT = "TerrakubeV2_OrgSetup_";

        private static String TEMPLATE_PLAN = "flow:\n" +
                        "  - type: \"terraformPlan\"\n" +
                        "    name: \"Plan\"\n" +
                        "    step: 100" +
                        "";

        private static String TEMPLATE_APPLY = "flow:\n" +
                        "  - type: \"terraformPlan\"\n" +
                        "    name: \"Plan\"\n" +
                        "    step: 100\n" +
                        "  - type: \"terraformApply\"\n" +
                        "    name: \"Apply\"\n" +
                        "    step: 200" +
                        "";

        private static String TEMPLATE_DESTROY = "flow:\n" +
                        "  - type: \"terraformDestroy\"\n" +
                        "    name: \"Destroy\"\n" +
                        "    step: 100" +
                        "";

        private static String TEMPLATE_APPLY_CLI = "flow:\n" +
                        "- type: \"terraformPlan\"\n" +
                        "  name: \"Terraform Plan from Terraform CLI\"\n" +
                        "  step: 100\n" +
                        "- type: \"approval\"\n" +
                        "  name: \"Approve Plan from Terraform CLI\"\n" +
                        "  step: 150\n" +
                        "  team: \"TERRAFORM_CLI\"\n" +
                        "- type: \"terraformApply\"\n" +
                        "  name: \"Terraform Apply from Terraform CLI\"\n" +
                        "  step: 200\n";

        private static String TEMPLATE_DESTROY_CLI = "flow:\n" +
                        "- type: \"terraformPlanDestroy\"\n" +
                        "  name: \"Terraform Plan Destroy from Terraform CLI\"\n" +
                        "  step: 100\n" +
                        "- type: \"approval\"\n" +
                        "  name: \"Approve Plan from Terraform CLI\"\n" +
                        "  step: 150\n" +
                        "  team: \"TERRAFORM_CLI\"\n" +
                        "- type: \"terraformApply\"\n" +
                        "  name: \"Terraform Apply from Terraform CLI\"\n" +
                        "  step: 200\n";
        private final OrganizationRepository organizationRepository;

        TemplateRepository templateRepository;

        Scheduler scheduler;

        public void postCreationQuartzJob(Organization organization) {
                try {
                        String random = UUID.randomUUID().toString();
                        JobDataMap jobDataMap = new JobDataMap();
                        jobDataMap.put("organizationId", organization.getId().toString());

                        JobDetail jobDetail = JobBuilder.newJob().ofType(OrganizationPostCreation.class)
                                .storeDurably()
                                .setJobData(jobDataMap)
                                .withIdentity(PREFIX_JOB_CONTEXT + organization.getId() + "_" + random)
                                .withDescription(String.valueOf(organization.getId()))
                                .build();

                        Trigger trigger = TriggerBuilder.newTrigger()
                                .forJob(jobDetail)
                                .withIdentity(PREFIX_JOB_CONTEXT + organization.getId() + "_" + random)
                                .withDescription(String.valueOf(organization.getId()))
                                .startNow()
                                .build();

                        log.info("Running Organization Template Setup Now: {}, Identity: {}", organization.getId(),
                                PREFIX_JOB_CONTEXT + organization.getId() + "_" + random);
                        scheduler.scheduleJob(jobDetail, trigger);
                } catch (SchedulerException e) {
                        log.error(e.getMessage());
                }
        }

        public void postCreationSetup(Organization organization) {
                templateRepository.save(generateTemplate("Plan", "Running Terraform plan",
                                Base64.getEncoder().encodeToString(TEMPLATE_PLAN.getBytes()), organizationRepository.findById(organization.getId()).get()));
                templateRepository.save(generateTemplate("Plan and apply", "Running Terraform plan and apply",
                                Base64.getEncoder().encodeToString(TEMPLATE_APPLY.getBytes()), organizationRepository.findById(organization.getId()).get()));
                templateRepository.save(generateTemplate("Destroy", "Running Terraform destroy",
                                Base64.getEncoder().encodeToString(TEMPLATE_DESTROY.getBytes()), organizationRepository.findById(organization.getId()).get()));
                templateRepository.save(generateTemplate("Terraform-Plan/Apply-Cli",
                                "Running Terraform apply from Terraform CLI",
                                Base64.getEncoder().encodeToString(TEMPLATE_APPLY_CLI.getBytes()), organizationRepository.findById(organization.getId()).get()));
                templateRepository.save(generateTemplate("Terraform-Plan/Destroy-Cli",
                                "Running Terraform destroy from Terraform CLI",
                                Base64.getEncoder().encodeToString(TEMPLATE_DESTROY_CLI.getBytes()), organizationRepository.findById(organization.getId()).get()));
        }

        private Template generateTemplate(String name, String description, String tcl, Organization organization) {
                Template template = new Template();
                template.setId(UUID.randomUUID());
                template.setName(name);
                template.setDescription(description);
                template.setVersion("1.0.0");
                template.setTcl(tcl);
                template.setOrganization(organization);
                return template;
        }
}
