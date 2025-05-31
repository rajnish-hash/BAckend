class ApiError extends Error{
    constructor(
        statusCode,
        message="Something went wrong",
        errors=[],
        stack=""
    ){
        super(message)
        this.statusCode=statusCode
        this.data=null
        this.message=message
        this.success=false
        this.errors=errors

        if(stack){
            this.stack=stack
        }else{
            Error.captureStackTrace(this, this.constructor)
        }

    }
}

class ApiSuccess {
  constructor(statusCode = 200, message = "", data = null) {
    this.statusCode = statusCode;
    this.success = true;
    this.message = message;
    this.data = data;
  }
}

export {ApiError, ApiSuccess};