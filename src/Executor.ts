import { Execution } from "./services/ExecutionImpl";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { exec } from "child_process";

import dotenv from "dotenv";
dotenv.config();

class Executor{

  
  private exec_obj: Execution;
  private issues_flag: boolean = false;

  constructor(ExecutionData:exec_data) {
    
  }


  async execute() :boolean{
  
    try {
      const exec_token: string | undefined = process.env.EXEC_TOKEN || "";
      let environment: string | undefined = process.env.APPURL || "";
      let threshold: number | string | undefined =
        process.env.THRESHOLD || "100";
      let verbose: boolean | undefined =
        process.env.VERBOSE.toLowerCase() === "true" || false;
  
      const invalid_exec_token_msg: string =
        " ERR: The EXEC_TOKEN value is invalid";
      const invalid_env_msg: string =
        " ERR: The APPURL value is invalid. (Resolving to default app url: https://simplifyqa.app)";
      const invalid_threshold_msg: string =
        " ERR: The THRESHOLD value is invalid. (Resolving to default threshold: 100%)";
  
      const exec_pass_status_msg: string = "Execution Passed!";
      const exec_fail_status_msg: string = "Execution Failed!";
      const exec_pass_with_warn_status_msg: string =
        "Execution performed successfully with resolved values. Please change the values to avoid future warnings.";
  
      if (exec_token.length != 88) {
        console.log(getTimestamp() + invalid_exec_token_msg);
  
        console.log(getTimestamp() + invalid_exec_token_msg        );
        console.log(          getTimestamp() + "*".repeat(51) + "EOF" + "*".repeat(51) + "\n"        );
  
        return false;
      }
  
      if (environment != undefined) {
        if (environment.length < 2) {
          issues_flag = true;
          console.log(getTimestamp() + invalid_env_msg);
          environment = "";
        }
      } else {
        issues_flag = true;
        console.log(getTimestamp() + invalid_env_msg);
        environment = "";
      }
  
      if (threshold != undefined) {
        if (Number.isNaN(Number.parseFloat(threshold))) {
          issues_flag = true;
          console.log(getTimestamp() + invalid_threshold_msg);
          threshold = 100;
        } else {
          threshold = Number.parseFloat(threshold);
          if (threshold > 100 || threshold < 0) {
            issues_flag = true;
            console.log(getTimestamp() + invalid_threshold_msg);
            threshold = 100;
          }
        }
      } else {
        issues_flag = true;
        console.log(getTimestamp() + invalid_threshold_msg);
        threshold = 100;
      }
  
      if (verbose == undefined) {
        issues_flag = true;
        verbose = false;
      }
      console.log("\n");
      console.log(
        getTimestamp() +
          "**************************************SIMPLIFYQA PIPELINE CONNECTOR**************************************"
      );
      console.log(getTimestamp() + "The Set Parameters are:");
      // console.log(getTimestamp() + "=".repeat(105));
      exec_obj = new Execution({
        exec_token: exec_token,
        env: environment,
        threshold: threshold,
        verbose: verbose,
      });
      console.log(
        getTimestamp() +
          "Execution Token: " +
          "*".repeat(70) +
          exec_obj
            .getExecToken()
            .slice(
              exec_obj.getExecToken().length - 18,
              exec_obj.getExecToken().length
            )
      );
      console.log(getTimestamp() + "App Url: " + exec_obj.getAppUrl());
      console.log(
        getTimestamp() + "Threshold: " + exec_obj.getThreshold() + " %"
      );
      console.log(getTimestamp() + "Verbose: " + exec_obj.getVerbose());
  
      let triggered: any = await exec_obj.startExec();
  
      if (triggered === null && !exec_obj.getRetry()) {
        console.log(`\n${getTimestamp()}${exec_fail_status_msg}`);
        process.stdout.write(getTimestamp());
        console.log(" Execution Failed!");
        console.log("\n");
        console.log(
          getTimestamp() + "*".repeat(51) + "EOF" + "*".repeat(51) + "\n"
        );
        return false;
      }
  
      console.log(
        `\n${getTimestamp()}EXECUTION STATUS: INITIALIZING TESTCASES in the triggered suite`
      );
      let status: any = null;
      status = await exec_obj.checkExecStatus({ payload_flag: true });
  
      while (status === null) {
        status = await new Promise((resolve) => {
          setTimeout(async () => {
            const newStatus = await exec_obj.checkExecStatus({
              payload_flag: false,
            });
            resolve(newStatus);
          }, 5000);
        });
        console.log(status);
      }
  
      console.log(
        `\n${getTimestamp()}EXECUTION STATUS: Execution IN-PROGRESS for Suite ID: SU-${exec_obj.getCustId()}${exec_obj.getSuiteId()}`
      );
      console.log(
        `${" ".repeat(
          27
        )}(Executed ${exec_obj.getExecutedTcs()} of ${exec_obj.getTotalTcs()} testcase(s), execution percentage: ${exec_obj
          .getExecPercent()
          .toFixed(2)} %, fail percentage: ${exec_obj
          .getFailPercent()
          .toFixed(2)} %, threshold: ${exec_obj.getThreshold().toFixed(2)} % )\n`
      );
  
      let results_array: any = status.data.data.result;
  
      results_array.forEach(
        (item: {
          tcCode: string;
          tcName: string;
          result: string;
          totalSteps: number;
        }) => {
          console.log(
            `${" ".repeat(27)}${item.tcCode}: ${
              item.tcName
            } | TESTCASE ${item.result.toUpperCase()} (total steps: ${
              item.totalSteps
            })`
          );
        }
      );
  
      if (exec_obj.getVerbose()) {
        console.log(
          `\n${getTimestamp()}REQUEST BODY: ${JSON.stringify(
            exec_obj.getStatusPayload()
          )}`
        );
      }
  
      if (exec_obj.getVerbose()) {
        console.log(
          `\n${getTimestamp()}RESPONSE BODY: ${JSON.stringify(status)}`
        );
      }
  
      while (
        exec_obj.getExecStatus() === "INPROGRESS" &&
        exec_obj.getThreshold() > exec_obj.getFailPercent()
      ) {
        let curr_tcs = exec_obj.getExecutedTcs();
  
        status = await new Promise((resolve) => {
          setTimeout(async () => {
            const newStatus = await exec_obj.checkExecStatus({
              payload_flag: false,
            });
            resolve(newStatus);
          }, 5000);
        });
  
        if (curr_tcs < exec_obj.getExecutedTcs()) {
          console.log(
            `\n${getTimestamp()}EXECUTION STATUS: Execution ${exec_obj.getExecStatus()} for Suite ID: SU-${exec_obj.getCustId()}${exec_obj.getSuiteId()}`
          );
          console.log(
            `${" ".repeat(
              27
            )}(Executed ${exec_obj.getExecutedTcs()} of ${exec_obj.getTotalTcs()} testcase(s), execution percentage: ${exec_obj
              .getExecPercent()
              .toFixed(2)} %, fail percentage: ${exec_obj
              .getFailPercent()
              .toFixed(2)} %, threshold: ${exec_obj
              .getThreshold()
              .toFixed(2)} % )\n`
          );
          let results_array: any = status.data.data.result;
  
          results_array.forEach(
            (item: {
              tcCode: string;
              tcName: string;
              result: string;
              totalSteps: number;
            }) => {
              console.log(
                `${" ".repeat(27)}${item.tcCode}: ${
                  item.tcName
                } | TESTCASE ${item.result.toUpperCase()} (total steps: ${
                  item.totalSteps
                })`
              );
            }
          );
  
          if (exec_obj.getVerbose()) {
            console.log(
              `\n${getTimestamp()}REQUEST BODY: ${JSON.stringify(
                exec_obj.getStatusPayload()
              )}`
            );
          }
  
          if (exec_obj.getVerbose()) {
            console.log(
              `\n${getTimestamp()}RESPONSE BODY: ${JSON.stringify(status)}`
            );
          }
        }
  
        if (exec_obj.getThreshold() <= exec_obj.getFailPercent()) {
          console.log(`\n${getTimestamp()}THRESHOLD REACHED!!!!!!!!!!!!!!!!!`);
          break;
        }
      }
  
      if (exec_obj.getThreshold() <= exec_obj.getFailPercent()) {
        console.log(
          `\n${getTimestamp()}EXECUTION STATUS: Execution ${exec_obj.getExecStatus()} for Suite ID: SU-${exec_obj.getCustId()}${exec_obj.getSuiteId()}`
        );
        console.log(
          `${" ".repeat(
            27
          )}(Executed ${exec_obj.getExecutedTcs()} of ${exec_obj.getTotalTcs()} testcase(s), execution percentage: ${exec_obj
            .getExecPercent()
            .toFixed(2)} %, fail percentage: ${exec_obj
            .getFailPercent()
            .toFixed(2)} %, threshold: ${exec_obj
            .getThreshold()
            .toFixed(2)} % )\n`
        );
        results_array = status.data.data.result;
  
        results_array.forEach(
          (item: {
            tcCode: string;
            tcName: string;
            result: string;
            totalSteps: number;
          }) => {
            console.log(
              `${" ".repeat(27)}${item.tcCode}: ${
                item.tcName
              } | TESTCASE ${item.result.toUpperCase()} (total steps: ${
                item.totalSteps
              })`
            );
          }
        );
  
        if (exec_obj.getVerbose()) {
          console.log(
            `\n${getTimestamp()}REQUEST BODY: ${JSON.stringify(
              exec_obj.getStatusPayload()
            )}`
          );
        }
  
        if (exec_obj.getVerbose()) {
          console.log(
            `\n${getTimestamp()}RESPONSE BODY: ${JSON.stringify(status)}`
          );
        }
  
        console.log(`\n${getTimestamp()}${exec_fail_status_msg}`);
        process.stdout.write(getTimestamp());
        console.log( " Execution Failed!");
  
        let kill_status: any = await exec_obj.killExec();
  
        if (kill_status === null) {
          console.log(
            `\n${getTimestamp()}EXECUTION STATUS: FAILED to explicitly kill the execution!`
          );
        } else {
          console.log(
            `\n${getTimestamp()}EXECUTION STATUS: SUCCESSFUL to explicitly kill the execution!`
          );
        }
  
        if (exec_obj.getVerbose()) {
          console.log(
            `\n${getTimestamp()}REQUEST BODY: ${JSON.stringify(
              exec_obj.getKillPayload()
            )}`
          );
        }
  
        if (exec_obj.getVerbose()) {
          console.log(
            `\n${getTimestamp()}RESPONSE BODY: ${JSON.stringify(kill_status)}`
          );
        }
      } else {
        console.log(
          `\n${getTimestamp()}EXECUTION STATUS: Execution ${exec_obj.getExecStatus()} for Suite ID: SU-${exec_obj.getCustId()}${exec_obj.getSuiteId()}`
        );
        console.log(
          `${" ".repeat(
            27
          )}(Executed ${exec_obj.getExecutedTcs()} of ${exec_obj.getTotalTcs()} testcase(s), execution percentage: ${exec_obj
            .getExecPercent()
            .toFixed(2)} %, fail percentage: ${exec_obj
            .getFailPercent()
            .toFixed(2)} %, threshold: ${exec_obj
            .getThreshold()
            .toFixed(2)} % )\n`
        );
        results_array = status.data.data.result;
  
        results_array.forEach(
          (item: {
            tcCode: string;
            tcName: string;
            result: string;
            totalSteps: number;
          }) => {
            console.log(
              `${" ".repeat(27)}${item.tcCode}: ${
                item.tcName
              } | TESTCASE ${item.result.toUpperCase()} (total steps: ${
                item.totalSteps
              })`
            );
          }
        );
  
        if (exec_obj.getVerbose()) {
          console.log(
            `\n${getTimestamp()}REQUEST BODY: ${JSON.stringify(
              exec_obj.getStatusPayload()
            )}`
          );
        }
  
        if (exec_obj.getVerbose()) {
          console.log(
            `\n${getTimestamp()}RESPONSE BODY: ${JSON.stringify(status)}`
          );
        }
  
        if (issues_flag) {
          console.log(`\n${getTimestamp()}${exec_pass_with_warn_status_msg}`);
          process.stdout.write(getTimestamp());
          console.log(
            " Execution Succeded with Issues!"
          );
        } else {
          console.log(`\n${getTimestamp()}${exec_pass_status_msg}`);
          process.stdout.write(getTimestamp());
          console.log(
            " Execution Succeded!"
          );
        }
      }
  
      console.log(`\n${getTimestamp()}REPORT URL: ${exec_obj.getReportUrl()}`);
      console.log(
        getTimestamp() + "*".repeat(51) + "EOF" + "*".repeat(51) + "\n"
      );
  
      return;
    } catch (err: any) {
      task_obj.setResult(task_obj.TaskResult.Failed, err.message);
      return;
    }
  }
  
  function getTimestamp(): string {
    return "[" + format(new Date(), "dd-MMM-yyyy HH:mm:ss") + " GMT] ";
  }
  
}
