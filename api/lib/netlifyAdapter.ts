import type { Handler, HandlerEvent } from '@netlify/functions';

class MockResponse {
  private _status = 200;
  private _body = '';
  private _headers: Record<string, string> = {};

  status(code: number) {
    this._status = code;
    return this;
  }

  json(data: any) {
    this._body = JSON.stringify(data);
    this._headers['Content-Type'] = 'application/json';
    return this;
  }

  end() {
    this._body = '';
    return this;
  }

  toResult() {
    return {
      statusCode: this._status,
      body: this._body,
      headers: this._headers,
    };
  }
}

export function adaptHandler(
  fn: (req: any, res: any) => Promise<any>
): Handler {
  return async (event: HandlerEvent) => {
    const req = {
      method: event.httpMethod,
      headers: event.headers,
      query: event.queryStringParameters || {},
      body: event.body ? JSON.parse(event.body) : {},
    };

    const res = new MockResponse();
    await fn(req, res);
    return res.toResult();
  };
}
