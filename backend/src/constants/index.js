/**
 * index.js — Constants Barrel Export
 *
 * Re-exports all constants from a single entry point.
 * Keeps import statements short across the codebase.
 *
 * Usage:
 *   import { HTTP, ROLES } from '../constants/index.js'
 */

export { default as HTTP  } from './httpStatus.js';
export { default as ROLES } from './roles.js';
