import { AxiosHeaders, AxiosResponse, AxiosError } from "axios";
import {
  startExecData,
  getExecStatusData,
  killExecData,
} from "../../models/ExecutionDataTypes";

export interface ConnHandler {
  handleSuccess(response: AxiosResponse): boolean;
  handleError(error: AxiosError): boolean;
  makePostRequest({
    url,
    data,
    headers,
  }: {
    url: string;
    data: startExecData | getExecStatusData | killExecData;
    headers: AxiosHeaders;
  }): Promise<AxiosResponse | AxiosError | Error>;
}
