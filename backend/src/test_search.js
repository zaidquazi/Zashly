import { searchQuery } from "./validators/common.validators.js";
import Joi from "joi";

const toValidate = {
  body: {},
  query: { query: "za" },
  params: {}
};

const { error, value } = searchQuery.validate(toValidate, {
  abortEarly: false,
  stripUnknown: true,
});

if (error) {
  console.log("ERROR:", error.details.map((d) => d.message));
} else {
  console.log("SUCCESS:", value);
}
