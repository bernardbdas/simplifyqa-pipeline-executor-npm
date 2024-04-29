type startExecData {
  token: string;
}

type getExecStatusData {
  executionId: number;
  customerId: number;
  projectId: number;
}

type killExecData {
  customerId: number;
  id: number;
  userId: number;
  userName: string;
}

type ExecutionData = {
    token: string;
    app_url?: string;
    threhsold?: number;
    verbose?: boolean;
  };

export enum ExecutionStatus{
    UNINITIALIZED = "Uninitialized",
    INPROGRESS = "Inprogress",
    FAILED = "Failed",
    COMPLETED = "Completed"}

export type { startExecData, getExecStatusData, killExecData, ExecutionData};
