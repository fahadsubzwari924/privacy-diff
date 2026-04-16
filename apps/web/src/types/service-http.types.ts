export type JsonBody = Record<string, unknown>;

export type JsonServiceResult = {
  status: number;
  body: JsonBody;
};
