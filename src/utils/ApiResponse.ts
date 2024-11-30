class ApiResponse<T> {
  data: T;
  message: string;
  status: boolean;
  errors: string[];
  statusCode: number;

  constructor(
    statusCode: number = 200,
    message: string = "Successful Response",
    data: T,
    status: boolean = true,
    errors: string[] = []
  ) {
    this.data = data;
    this.message = message;
    this.status = status;
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export default ApiResponse;
