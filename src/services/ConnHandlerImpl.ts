import { ConnHandler } from "./interfaces/ConnHandler";
import { error } from "console";

import axios, {
  Axios,
  AxiosError,
  AxiosHeaders,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";

import {
  startExecData,
  getExecStatusData,
  killExecData,
} from "../models/ExecutionDataTypes";

class ConnHandlerImpl implements ConnHandler {
  handleSuccess(response: AxiosResponse): boolean {
    return response.status === 200 || response.status === 201;
  }

  handleError(error: AxiosError): boolean {
    return false;
  }

  public async makePostRequest({
    url,
    data,
    headers,
  }: {
    url: string;
    data: startExecData | getExecStatusData | killExecData;
    headers: AxiosHeaders;
  }): Promise<AxiosResponse | AxiosError | Error> {
    try {
      const response = await axios.post(url, data, {
        timeout: 5 * 60 * 1000,
        headers,
      });

      return response;
    } catch (error: any) {
      return error;
    }
  }
}

export { ConnHandlerImpl as ConnHandler };
