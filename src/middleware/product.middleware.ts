import { check } from "express-validator";
import { handleValidationErrors } from "./errors.middleware";

export const validateCreateProductRequest = [
  check("name", "name is required").isString(),
  check("description", "description is required").isString(),
  check("price", "price is required").isNumeric(),
  check("image", "image is required").isString(),
  check("category", "category is required").isString(),
  handleValidationErrors,
];
