const mongoose = require("mongoose");
const ApiError = require("../utils/apiError");

function validateObjectId(param = "id") {
  return (req, _res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params[param])) {
      return next(new ApiError(400, `Invalid ${param}`));
    }

    return next();
  };
}

module.exports = validateObjectId;
