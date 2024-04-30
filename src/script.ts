import { Executor, ExecutionData } from "simplifyqa-pipeline-executor";

const data: ExecutionData = {
  exec_token:
    "U2FsdGVkX19qkmKPNcU7zY6vSFpm6+43gVGpHyup3KvCmPhlvc/asC48At0FLSXWJdeIdryyNbggxBUX2m2zzQ==",
  env: "https://qa.simplifyqa.app",
  threshold: 100,
  verbose: true,
};

new Executor().execute(data);
