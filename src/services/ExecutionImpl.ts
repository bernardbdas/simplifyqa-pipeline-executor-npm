import { format } from "date-fns";
import { Execution } from "./interfaces/Execution";
import {
  startExecData,
  getExecStatusData,
  killExecData,
  ExecutionStatus,
  ExecutionData,
  getExecutionStatus,
} from "../models/ExecutionDataTypes";
import axios, { AxiosError, AxiosHeaders, AxiosResponse } from "axios";
import { ConnHandler } from "./ConnHandlerImpl";

class ExecutionImpl implements Execution {
  // Pre-Execution Data Members
  private exec_token: string = "";
  private app_url: string = "";
  private build_api: string = "/jenkinsSuiteExecution";
  private status_api: string = "/getJenkinsExecStatus";
  private kill_api: string = "/getsession/killExecutionReports";
  private exec_logs_api: string = "/executionlog";

  private env: string = "";
  private threshold: number = 100;
  private verbose_flag: boolean = false;

  // These variables are initialized from the internal APIs of SQA
  private exec_id: number = NaN;
  private project_id: number = NaN;
  private customer_id: number = NaN;
  private user_name: string = "";
  private user_id: number = NaN;
  private auth_key: string = "";
  private retry: boolean = false;

  //Log Maintenance
  private api_logs: string = "";

  //Post-Execution trigger Data Members
  private conn_obj!: ConnHandler;

  private trigger_payload!: startExecData;
  private status_payload!: getExecStatusData;
  private kill_payload!: killExecData;
  private request_header: AxiosHeaders = new AxiosHeaders();

  private suite_id: number = 0;
  private fail_percent: number = 0.0;
  private exec_percent: number = 0.0;
  private total_tcs: number = 0;
  private tcs_inprogress: number = 0;
  private executed_tcs: number = 0;
  private tcs_failed: number = 0;
  private report_url: string = "";

  private exec_status: ExecutionStatus = ExecutionStatus.UNINITIALIZED;

  constructor(data: ExecutionData) {
    this.setExecToken(data.exec_token);

    if ((data.env != undefined && data.env.length > 1) || data.env === "") {
      this.setEnv(data.env);
    } else console.log("ERR: Invalid Environment value entered!");

    if (data.threshold != undefined) this.setThreshold(data.threshold);

    if (data.verbose != undefined) this.setVerbose(data.verbose);

    this.setAppUrl(this.env);
    this.setBuildApi(this.env + this.build_api);
    this.setStatusApi(this.env + this.status_api);
    this.setKillApi(this.env + this.kill_api);
    this.setExecLogsApi(this.env + this.exec_logs_api);
  }

  //Member Functions
  protected setExecToken(exec_token: string): void {
    this.exec_token = exec_token;
  }
  public getExecToken(): string {
    return this.exec_token;
  }

  protected setAppUrl(app_url: string): void {
    this.app_url = app_url;
  }
  public getAppUrl(): string {
    return this.app_url;
  }

  protected setBuildApi(build_api: string): void {
    this.build_api = build_api;
  }
  public getBuildApi(): string {
    return this.build_api;
  }

  protected setStatusApi(status_api: string): void {
    this.status_api = status_api;
  }
  public getStatusApi(): string {
    return this.status_api;
  }

  protected setKillApi(kill_api: string): void {
    this.kill_api = kill_api;
  }
  public getKillApi(): string {
    return this.kill_api;
  }

  protected setExecLogsApi(exec_logs_api: string): void {
    this.exec_logs_api = exec_logs_api;
  }
  public getExecLogsApi(): string {
    return this.exec_logs_api;
  }

  protected setEnv(env: string): void {
    if (env === "") this.env = "https://simplifyqa.app";
    else this.env = env;
  }
  public getEnv(): string {
    return this.env;
  }

  protected setThreshold(threshold: number): void {
    this.threshold = threshold;
  }
  public getThreshold(): number {
    return this.threshold;
  }

  protected setVerbose(verbose_flag: boolean): void {
    this.verbose_flag = verbose_flag;
  }
  public getVerbose(): boolean {
    return this.verbose_flag;
  }

  /********************/
  protected setExecId(exec_id: number): void {
    this.exec_id = exec_id;
  }
  public getExecId(): number {
    return this.exec_id;
  }

  protected setProjectId(project_id: number): void {
    this.project_id = project_id;
  }
  public getProjectId(): number {
    return this.project_id;
  }

  protected setCustId(customer_id: number): void {
    this.customer_id = customer_id;
  }
  public getCustId(): number {
    return this.customer_id;
  }

  protected setUserId(user_id: number): void {
    this.user_id = user_id;
  }
  public getUserId(): number {
    return this.user_id;
  }

  protected setUserName(user_name: string): void {
    this.user_name = user_name;
  }
  public getUserName(): string {
    return this.user_name;
  }

  protected setAuthKey(auth_key: string): void {
    this.auth_key = auth_key;
  }
  public getAuthKey(): string {
    return this.auth_key;
  }

  protected setRetry(retry: boolean): void {
    this.retry = retry;
  }
  public getRetry(): boolean {
    return this.retry;
  }

  protected setApiLogs(api_logs: string): void {
    this.api_logs = api_logs;
  }
  public getApiLogs(): string {
    return this.api_logs;
  }

  protected setReqHeader(): void {
    this.request_header.set({
      "Content-Type": "application/json",
      Authorization: this.auth_key,
    });
  }

  public getReqHeader(): AxiosHeaders {
    return this.request_header;
  }

  public getTimestamp(): string {
    return "[" + format(new Date(), "dd-MMM-yyyy HH:mm:ss") + " GMT] ";
  }

  protected setExecPercent(): void {
    this.exec_percent = (this.executed_tcs / this.total_tcs) * 100;
    if (isNaN(this.exec_percent)) this.exec_percent = 0.0;
  }

  public getExecPercent(): number {
    return this.exec_percent;
  }

  protected setFailPercent(): void {
    this.fail_percent = (this.tcs_failed / this.total_tcs) * 100;
    if (isNaN(this.fail_percent)) this.fail_percent = 0.0;
  }

  public getFailPercent(): number {
    return this.fail_percent;
  }

  protected setSuiteId(suite_id: number): void {
    this.suite_id = suite_id;
  }

  public getSuiteId(): number {
    return this.suite_id;
  }

  protected setExecStatus(exec_status: ExecutionStatus): void {
    this.exec_status = exec_status;
  }

  public getExecStatus(): string {
    return this.exec_status;
  }

  protected setReportUrl(report_url: string): void {
    this.report_url = report_url;
  }

  public getReportUrl(): string {
    return this.report_url;
  }

  protected setTotalTcs(total_tcs: number): void {
    this.total_tcs = total_tcs;
  }

  public getTotalTcs(): number {
    return this.total_tcs;
  }

  protected setExecutedTcs(executed_tcs: number): void {
    this.executed_tcs = executed_tcs;
  }

  public getExecutedTcs(): number {
    return this.executed_tcs;
  }

  public getTriggerPayload(): startExecData {
    return this.trigger_payload;
  }

  public getStatusPayload(): getExecStatusData {
    return this.status_payload;
  }

  public getKillPayload(): killExecData {
    return this.kill_payload;
  }

  public async startExec(): Promise<any> {
    try {
      this.conn_obj = new ConnHandler();
      this.trigger_payload = {
        token: this.exec_token,
      };
      this.setReqHeader();

      if (this.verbose_flag) {
        console.log(
          `\n${this.getTimestamp()}REQUEST BODY: ${JSON.stringify(
            this.trigger_payload
          )}`
        );
      }

      const resp: AxiosResponse | AxiosError | Error =
        await this.conn_obj.makePostRequest({
          url: this.build_api,
          data: this.trigger_payload,
          headers: this.request_header,
        });

      if (axios.isAxiosError(resp)) {
        if (resp.response) {
          const status_code = resp.response.status;

          if (this.verbose_flag) {
            console.log(
              `${this.getTimestamp()}RESPONSE BODY: ${JSON.stringify(
                resp.response.data
              )}`
            );
          }

          const statusMessages: { [key: number]: string } = {
            400: "Invalid Execution token for the specified env: ",
            403: "Invalid Execution token for the specified env: ",
            500: "The cloud server or the local machine is unavailable for the specified env: ",
            504: "The server gateway timed-out for the specified env: ",
          };

          if (status_code >= 400 && status_code < 600) {
            // Condition for 504 Gateway timed-out
            // if (status_code === 504) {
            //   console.log(
            //     `${this.getTimestamp()}EXECUTION STATUS: Status code ${status_code}, Execution did not get triggered. Retrying startExec()`
            //   );
            //   this.retry = true;
            //   return null;
            // }

            const statusMessage =
              statusMessages[status_code] || resp.response.statusText;
            console.error(
              `\n${this.getTimestamp()}EXECUTION STATUS: Status code ${status_code}, Execution did not get triggered.`
            );
            console.error(
              `${this.getTimestamp()}REASON OF FAILURE: ${
                statusMessages[status_code]
              } ${this.app_url}`
            );
          }
          return null;
        } else if (resp.request) {
          console.error(
            `\n${this.getTimestamp()}EXECUTION STATUS: No response received. Is the server down?`
          );
          return null;
        } else {
          console.error(
            `\n${this.getTimestamp()}EXECUTION STATUS: Something is critically broken on SQA Servers.`
          );
          console.error(
            `${this.getTimestamp()}REASON OF FAILURE: ${resp.message}`
          );
          return null;
        }
      } else {
        const response_data: any = "data" in resp ? resp.data : null;
        if (this.verbose_flag) {
          console.log(
            `${this.getTimestamp()}RESPONSE BODY: ${JSON.stringify(
              response_data
            )}`
          );
        }
        if (response_data === null) {
          return null;
        } else if (response_data.success) {
          this.setExecId(response_data.executionId);
          this.setAuthKey(response_data.authKey);
          this.setProjectId(response_data.projectId);
          this.setCustId(response_data.customerId);
          console.log(response_data);
          return response_data;
        }
        return null;
      }
    } catch (error: any) {
      console.error(
        `\n${this.getTimestamp()}An error occurred: ${error.message}`
      );
      return error;
    }
  }

  public async checkExecStatus({
    payload_flag,
  }: {
    payload_flag: boolean;
  }): Promise<any> {
    try {
      this.conn_obj = new ConnHandler();
      this.status_payload = {
        executionId: this.exec_id,
        customerId: this.customer_id,
        projectId: this.project_id,
      };
      this.setReqHeader();

      // if ((this.verbose_flag) && (payload_flag)) {
      //     console.log(`\n${this.getTimestamp()}REQUEST BODY: ${JSON.stringify(this.status_payload)}`);
      // }

      const resp: AxiosResponse | AxiosError | Error =
        await this.conn_obj.makePostRequest({
          url: this.status_api,
          data: this.status_payload,
          headers: this.request_header,
        });

      if (axios.isAxiosError(resp)) {
        if (resp.response) {
          const status_code = resp.response.status;

          if (this.verbose_flag && resp.response.data.success && payload_flag) {
            console.log(
              `${this.getTimestamp()}RESPONSE BODY: ${JSON.stringify(
                resp.response.data
              )}`
            );
          }

          const statusMessages: { [key: number]: string } = {
            400: "Logout and login again, Invalid Execution token for the specified env: ",
            403: "Logout and login again, Invalid Authorization token for the specified env: ",
            500: "The Pipeline Token is invalid for the specified env: ",
            504: "The server gateway timed-out for the specified env: ",
          };

          if (status_code >= 400 && status_code < 600) {
            const statusMessage =
              statusMessages[status_code] || resp.response.statusText;
            //console.error(`${this.getTimestamp()}EXECUTION STATUS: Status code ${status_code}, Execution did not get triggered.`);
            //console.error(`${this.getTimestamp()}REASON OF FAILURE: ${statusMessages[status_code]} ${this.app_url}`);
          }
          return null;
        } else if (resp.request) {
          console.error(
            `\n${this.getTimestamp()}EXECUTION STATUS: No response received. Is the server down?`
          );
          return null;
        } else {
          console.error(
            `\n${this.getTimestamp()}EXECUTION STATUS: Something is critically broken on SQA Servers.`
          );
          console.error(
            `${this.getTimestamp()}REASON OF FAILURE: ${resp.message}`
          );
          return null;
        }
      } else {
        const response_data: any = "data" in resp ? resp.data : null;

        if (response_data === null) {
          return null;
        } else if (response_data.success) {
          this.tcs_failed = 0;
          response_data.data.data.result.forEach((item: { result: string }) => {
            if (item.result.toUpperCase() === "FAILED")
              this.tcs_failed = this.tcs_failed + 1;
          });

          this.setExecutedTcs(response_data.data.data.result.length);
          this.setTotalTcs(response_data.data.data.totalTestcases);
          this.setSuiteId(response_data.data.data.suiteId);
          this.setReportUrl(response_data.data.data.reporturl);
          this.setExecStatus(getExecutionStatus(response_data.data.data.execution));
          this.setUserId(response_data.data.data.userId);
          this.setUserName(response_data.data.data.username);
          this.setFailPercent();
          this.setExecPercent();

          return response_data;
        }
        return null;
      }
    } catch (error: any) {
      console.error(
        `\n${this.getTimestamp()}An error occurred: ${error.message}`
      );
      return error;
    }
  }

  public async killExec(): Promise<any> {
    try {
      this.conn_obj = new ConnHandler();
      this.kill_payload = {
        customerId: this.customer_id,
        id: this.exec_id,
        userId: this.user_id,
        userName: this.user_name,
      };
      this.setReqHeader();

      if (this.verbose_flag) {
        console.log(
          `\n${this.getTimestamp()}REQUEST BODY: ${JSON.stringify(
            this.kill_payload
          )}`
        );
      }

      const resp: AxiosResponse | AxiosError | Error =
        await this.conn_obj.makePostRequest({
          url: this.kill_api,
          data: this.kill_payload,
          headers: this.request_header,
        });

      if (axios.isAxiosError(resp)) {
        if (resp.response) {
          const status_code = resp.response.status;

          if (this.verbose_flag) {
            console.log(
              `${this.getTimestamp()}RESPONSE BODY: ${JSON.stringify(
                resp.response.data
              )}`
            );
          }

          const statusMessages: { [key: number]: string } = {
            400: "Invalid Execution token for the specified env: ",
            403: "Invalid Execution token for the specified env: ",
            500: "The cloud server or the local machine is unavailable for the specified env: ",
            504: "The server gateway timed-out for the specified env: ",
          };

          if (status_code >= 400 && status_code < 600) {
            const statusMessage =
              statusMessages[status_code] || resp.response.statusText;
            console.error(
              `\n${this.getTimestamp()}EXECUTION STATUS: Status code ${status_code}, Execution did not kill successfully.`
            );
            console.error(
              `${this.getTimestamp()}REASON OF FAILURE: ${
                statusMessages[status_code]
              } ${this.app_url}`
            );
          }
          return null;
        } else if (resp.request) {
          console.error(
            `\n${this.getTimestamp()}EXECUTION STATUS: No response received. Is the server down?`
          );
          return null;
        } else {
          console.error(
            `\n${this.getTimestamp()}EXECUTION STATUS: Something is critically broken on SQA Servers.`
          );
          console.error(
            `${this.getTimestamp()}REASON OF FAILURE: ${resp.message}`
          );
          return null;
        }
      } else {
        const response_data: any = "data" in resp ? resp.data : null;
        if (this.verbose_flag) {
          console.log(
            `${this.getTimestamp()}RESPONSE BODY: ${JSON.stringify(
              response_data
            )}`
          );
        }
        if (response_data === null) {
          return null;
        } else if (response_data.sucess) {
          return response_data;
        }
        return null;
      }
    } catch (error: any) {
      console.error(
        `\n${this.getTimestamp()}An error occurred: ${error.message}`
      );
      return error;
    }
  }
}

export { ExecutionImpl as Execution };
