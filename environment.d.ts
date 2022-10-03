declare namespace NodeJS {
  interface ProcessEnv {
    PORT: string;
    APIKEY: string;
    APPID: string;
    MEASUREID: string;
    MESSAGEID: string;
    GHPAYLOADSECRET: string;
    MONGODB: string;
  }
}

type StatusFile = {
  instances: {
    id: string;
    status: 'running' | 'building' | 'error';
    upToDate: boolean;
  }[];
  newPush: boolean;
  instancesUpToDate: number;
};
