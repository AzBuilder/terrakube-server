package org.terrakube.executor.service.status;

import org.terrakube.executor.service.mode.TerraformJob;

public interface UpdateJobStatus {

    void setRunningStatus(TerraformJob job, String commitId);

    void setCompletedStatus(boolean successful, boolean isPlan, int exitCode, TerraformJob job, String jobOutput, String jobErrorOutput, String jobPlan, String commitId);
}
