export interface Execution {
  getExecToken(): string;
  getAppUrl(): string;
  getBuildApi(): string;
  getStatusApi(): string;
  getKillApi(): string;
  getExecLogsApi(): string;
  getEnv(): string;
  getThreshold(): number;
  getVerbose(): boolean;
  getExecId(): number;
  getProjectId(): number;
  getCustId(): number;
  getAuthKey(): string;
  getApiLogs(): string;
  getTimestamp(): string;
}
