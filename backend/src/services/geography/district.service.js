/**
 * district.service.js
 * Business logic for district master data.
 */

import * as geoRepo from '../../repositories/geography.repository.js';
import { AppError } from '../../utils/customError.js';
import HTTP from '../../constants/httpStatus.js';

export const getAllDistricts = async () => {
  return geoRepo.getAllDistricts();
};

export const getDistrictById = async (id) => {
  const district = await geoRepo.getDistrictById(id);
  if (!district) throw new AppError(`District with id ${id} not found`, HTTP.NOT_FOUND);
  return district;
};

export const getTalukasByDistrict = async (districtId) => {
  // Validate district exists first
  await getDistrictById(districtId);
  return geoRepo.getTalukasByDistrictId(districtId);
};
