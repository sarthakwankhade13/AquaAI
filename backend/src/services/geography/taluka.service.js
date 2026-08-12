/**
 * taluka.service.js
 * Business logic for taluka master data.
 */

import * as geoRepo from '../../repositories/geography.repository.js';
import { AppError } from '../../utils/customError.js';
import HTTP from '../../constants/httpStatus.js';

export const getTalukaById = async (id) => {
  const taluka = await geoRepo.getTalukaById(id);
  if (!taluka) throw new AppError(`Taluka with id ${id} not found`, HTTP.NOT_FOUND);
  return taluka;
};

export const getVillagesByTaluka = async (talukaId) => {
  await getTalukaById(talukaId);
  return geoRepo.getVillagesByTalukaId(talukaId);
};
