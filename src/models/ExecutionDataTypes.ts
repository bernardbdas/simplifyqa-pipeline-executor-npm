type startExecData = {
  token: string;
};

type getExecStatusData = {
  executionId: number;
  customerId: number;
  projectId: number;
};

type killExecData = {
  customerId: number;
  id: number;
  userId: number;
  userName: string;
};

type ExecutionData = {
  exec_token: string;
  env?: string;
  threshold?: number;
  verbose?: boolean;
};

enum ExecutionStatus {
  UNINITIALIZED = "Uninitialized",
  INPROGRESS = "Inprogress",
  FAILED = "Failed",
  COMPLETED = "Completed",
}

export function getExecutionStatus(statusString: string | null) {
  if (statusString === null) {
    return ExecutionStatus.UNINITIALIZED;
  } else {
    const lowerCaseStatusString = statusString.toLowerCase(); // Convert input to lowercase
    switch (lowerCaseStatusString) {
      case ExecutionStatus.UNINITIALIZED.toLowerCase(): // Convert enum value to lowercase
        return ExecutionStatus.UNINITIALIZED;
      case ExecutionStatus.INPROGRESS.toLowerCase():
        return ExecutionStatus.INPROGRESS;
      case ExecutionStatus.FAILED.toLowerCase():
        return ExecutionStatus.FAILED;
      case ExecutionStatus.COMPLETED.toLowerCase():
        return ExecutionStatus.COMPLETED;
      default:
        return ExecutionStatus.UNINITIALIZED; // Or throw an error if you prefer
    }
  }
}

export type { startExecData, getExecStatusData, killExecData, ExecutionData };
export { ExecutionStatus };
