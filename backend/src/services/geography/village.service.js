/**
 * village.service.js
 * Business logic for village master data.
 */

import * as geoRepo from '../../repositories/geography.repository.js';
import { AppError } from '../../utils/customError.js';
import HTTP from '../../constants/httpStatus.js';

export const getVillageById = async (id) => {
  const village = await geoRepo.getVillageById(id);
  if (!village) throw new AppError(`Village with id ${id} not found`, HTTP.NOT_FOUND);
  return village;
};

export const getVillagesFiltered = async ({ district_id, taluka_id, search }) => {
  return geoRepo.getVillagesFiltered({
    districtId: district_id,
    talukaId  : taluka_id,
    search    : search,
  });
};
