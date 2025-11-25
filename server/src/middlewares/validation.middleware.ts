import { body, param, query, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ValidationError } from '../utils/errors';

/**
 * Validation middleware wrapper
 */
export function validate(validations: ValidationChain[]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const formattedErrors: Record<string, string[]> = {};
    errors.array().forEach(error => {
      const field = 'path' in error ? error.path : 'unknown';
      if (!formattedErrors[field]) {
        formattedErrors[field] = [];
      }
      formattedErrors[field].push(error.msg);
    });

    return next(new ValidationError('Validation failed', formattedErrors));
  };
}

// Auth validations
export const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
];

export const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// Campaign validations
export const createCampaignValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('visibility')
    .optional()
    .isIn(['PUBLIC', 'PRIVATE'])
    .withMessage('Visibility must be PUBLIC or PRIVATE'),
];

export const updateCampaignValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid campaign ID'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('status')
    .optional()
    .isIn(['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED'])
    .withMessage('Invalid status'),
  body('visibility')
    .optional()
    .isIn(['PUBLIC', 'PRIVATE'])
    .withMessage('Visibility must be PUBLIC or PRIVATE'),
];

// Question validations
export const createQuestionValidation = [
  body('questionText')
    .trim()
    .notEmpty()
    .withMessage('Question text is required')
    .isLength({ min: 3, max: 500 })
    .withMessage('Question text must be between 3 and 500 characters'),
  body('type')
    .notEmpty()
    .withMessage('Question type is required')
    .isIn(['TEXT', 'PARAGRAPH', 'MULTIPLE_CHOICE', 'CHECKBOX', 'RATING', 'FILE_UPLOAD', 'DATE', 'NUMBER'])
    .withMessage('Invalid question type'),
  body('required')
    .optional()
    .isBoolean()
    .withMessage('Required must be a boolean'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer'),
];

// Manager validations
export const inviteManagerValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format'),
  body('permissions')
    .isArray({ min: 1 })
    .withMessage('At least one permission is required'),
  body('permissions.*')
    .isIn(['VIEW_RESULTS', 'EDIT_CAMPAIGN', 'MANAGE_RESPONDENTS'])
    .withMessage('Invalid permission'),
];

// Response validations
export const submitResponseValidation = [
  body('answers')
    .isArray({ min: 1 })
    .withMessage('At least one answer is required'),
  body('answers.*.questionId')
    .notEmpty()
    .withMessage('Question ID is required')
    .isUUID()
    .withMessage('Invalid question ID'),
  body('identifiableFields')
    .optional()
    .isObject()
    .withMessage('Identifiable fields must be an object'),
  body('consentGiven')
    .optional()
    .isBoolean()
    .withMessage('Consent must be a boolean'),
];

// Pagination validations
export const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

// ID parameter validation
export const idParamValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format'),
];
