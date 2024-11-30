class ApiError<T = null> extends Error {
  data: T;
  message: string;
  status: boolean;
  errors: string[];
  statusCode: number;

  constructor(
    message: string = "Something went wrong",
    statusCode: number = 500,
    errors: string[] = [],
    data: T = null as T,
  ) {
    super(message);

    this.errors = errors;
    this.message = message;
    this.data = data;
    this.status = false;
    this.statusCode = statusCode;

    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export default ApiError;
