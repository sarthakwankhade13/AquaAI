import api from './api';

/**
 * Water Request Service
 *
 * Handles all frontend API communication for:
 * - Creating water requests
 * - Listing water requests
 * - Viewing a request
 * - Updating request status
 * - Approving / rejecting requests
 * - Request history
 */

// ============================================================
// GET WATER REQUESTS
// ============================================================

export const getWaterRequests = async (params = {}) => {
    const response = await api.get('/water-requests', {
        params,
    });

    return response.data;
};

// ============================================================
// GET SINGLE WATER REQUEST
// ============================================================

export const getWaterRequestById = async (requestId) => {
    const response = await api.get(`/water-requests/${requestId}`);

    return response.data;
};

// ============================================================
// CREATE WATER REQUEST
// ============================================================

export const createWaterRequest = async (requestData) => {
    const response = await api.post(
        '/water-requests',
        requestData
    );

    return response.data;
};

// ============================================================
// UPDATE REQUEST STATUS
// ============================================================

export const updateWaterRequestStatus = async (
    requestId,
    status,
    remarks = ''
) => {
    const response = await api.patch(
        `/water-requests/${requestId}/status`,
        {
            status,
            remarks,
        }
    );

    return response.data;
};

// ============================================================
// APPROVE REQUEST
// ============================================================

export const approveWaterRequest = async (
    requestId,
    remarks = ''
) => {
    return updateWaterRequestStatus(
        requestId,
        'APPROVED',
        remarks
    );
};

// ============================================================
// REJECT REQUEST
// ============================================================

export const rejectWaterRequest = async (
    requestId,
    remarks = ''
) => {
    return updateWaterRequestStatus(
        requestId,
        'REJECTED',
        remarks
    );
};

// ============================================================
// MARK UNDER REVIEW
// ============================================================

export const reviewWaterRequest = async (
    requestId,
    remarks = ''
) => {
    return updateWaterRequestStatus(
        requestId,
        'UNDER_REVIEW',
        remarks
    );
};

// ============================================================
// CANCEL REQUEST
// ============================================================

export const cancelWaterRequest = async (
    requestId,
    remarks = ''
) => {
    return updateWaterRequestStatus(
        requestId,
        'CANCELLED',
        remarks
    );
};

// ============================================================
// GET REQUEST HISTORY
// ============================================================

export const getWaterRequestHistory = async (requestId) => {
    const response = await api.get(
        `/water-requests/${requestId}/history`
    );

    return response.data;
};

// ============================================================
// WATER AVAILABILITY
// ============================================================

export const getWaterAvailability = async () => {
    const response = await api.get(
        '/water-requests/availability'
    );

    return response.data;
};