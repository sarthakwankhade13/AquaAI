import { pool } from '../config/db.js';

/**
 * Water Request Repository
 *
 * Handles all database operations for:
 *  - water_requests
 *  - water_request_history
 *
 * Flow:
 *
 * Citizen / Taluka Admin
 *        ↓
 * createWaterRequest()
 *        ↓
 * PENDING
 *        ↓
 * Taluka Admin / District Admin
 *        ↓
 * updateWaterRequestStatus()
 *        ↓
 * History recorded automatically
 */

// ============================================================
// COMMON SELECT
// ============================================================

const WATER_REQUEST_SELECT = `
    SELECT
        wr.request_id,
        wr.requested_by,
        u.full_name AS requested_by_name,
        u.email AS requested_by_email,
        u.mobile AS requested_by_mobile,

        wr.approved_by,

        au.full_name AS approved_by_name,

        wr.request_type,
        wr.request_title,
        wr.request_reason,
        wr.required_quantity_liters,
        wr.required_date,
        wr.priority,
        wr.status,
        wr.recommended_tankers,
        wr.ai_risk_score,

        wr.state_code,
        wr.state_name,

        wr.district_code,
        wr.district_name,

        wr.taluka_code,
        wr.taluka_name,

        wr.village_code,
        wr.village_name,

        wr.remarks,
        wr.approved_at,
        wr.completed_at,

        wr.created_at,
        wr.updated_at

    FROM water_requests wr

    INNER JOIN users u
        ON wr.requested_by = u.user_id

    LEFT JOIN users au
        ON wr.approved_by = au.user_id
`;

// ============================================================
// CREATE WATER REQUEST
// ============================================================

export const createWaterRequest = async ({
    requestedBy,
    requestType,
    requestTitle,
    requestReason,
    requiredQuantityLiters,
    requiredDate,
    priority = 'MEDIUM',

    stateCode,
    stateName,

    districtCode,
    districtName,

    talukaCode,
    talukaName,

    villageCode,
    villageName,

    recommendedTankers = 0,
    aiRiskScore = null,
}) => {

    const [result] = await pool.execute(
        `
        INSERT INTO water_requests
        (
            requested_by,

            request_type,
            request_title,
            request_reason,
            required_quantity_liters,
            required_date,
            priority,

            status,

            recommended_tankers,
            ai_risk_score,

            state_code,
            state_name,

            district_code,
            district_name,

            taluka_code,
            taluka_name,

            village_code,
            village_name,

            created_at,
            updated_at
        )
        VALUES
        (
            ?,

            ?, ?, ?, ?, ?, ?,

            'PENDING',

            ?, ?,

            ?, ?,

            ?, ?,

            ?, ?,

            ?, ?,

            NOW(),
            NOW()
        )
        `,
        [
            requestedBy,

            requestType,
            requestTitle,
            requestReason,
            requiredQuantityLiters,
            requiredDate || null,
            priority,

            recommendedTankers,
            aiRiskScore,

            stateCode || null,
            stateName || null,

            districtCode || null,
            districtName || null,

            talukaCode || null,
            talukaName || null,

            villageCode || null,
            villageName || null,
        ]
    );

    return getWaterRequestById(result.insertId);
};

// ============================================================
// GET REQUEST BY ID
// ============================================================

export const getWaterRequestById = async (requestId) => {

    const [rows] = await pool.execute(
        `
        ${WATER_REQUEST_SELECT}

        WHERE wr.request_id = ?

        LIMIT 1
        `,
        [requestId]
    );

    return rows[0] || null;
};

// ============================================================
// GET ALL WATER REQUESTS
// ============================================================

export const getWaterRequests = async ({
    page = 1,
    limit = 10,
    search = '',
    status = null,
    districtCode = null,
    talukaCode = null,
    villageCode = null,
    requestedBy = null,
}) => {

    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];

    // --------------------------------------------------------
    // Requested By
    // --------------------------------------------------------

    if (requestedBy) {
        conditions.push('wr.requested_by = ?');
        params.push(requestedBy);
    }

    // --------------------------------------------------------
    // Status
    // --------------------------------------------------------

    if (status) {
        conditions.push('wr.status = ?');
        params.push(status);
    }

    // --------------------------------------------------------
    // District
    // --------------------------------------------------------

    if (districtCode) {
        conditions.push('wr.district_code = ?');
        params.push(districtCode);
    }

    // --------------------------------------------------------
    // Taluka
    // --------------------------------------------------------

    if (talukaCode) {
        conditions.push('wr.taluka_code = ?');
        params.push(talukaCode);
    }

    // --------------------------------------------------------
    // Village
    // --------------------------------------------------------

    if (villageCode) {
        conditions.push('wr.village_code = ?');
        params.push(villageCode);
    }

    // --------------------------------------------------------
    // Search
    // --------------------------------------------------------

    if (search) {

        const searchValue = `%${search}%`;

        conditions.push(`
            (
                wr.request_id LIKE ?
                OR wr.request_title LIKE ?
                OR wr.request_reason LIKE ?
                OR wr.village_name LIKE ?
                OR wr.taluka_name LIKE ?
                OR wr.district_name LIKE ?
                OR u.full_name LIKE ?
            )
        `);

        params.push(
            searchValue,
            searchValue,
            searchValue,
            searchValue,
            searchValue,
            searchValue,
            searchValue
        );
    }

    const whereClause =
        conditions.length
            ? `WHERE ${conditions.join(' AND ')}`
            : '';

    // --------------------------------------------------------
    // Fetch Requests
    // --------------------------------------------------------

    const [rows] = await pool.execute(
        `
        ${WATER_REQUEST_SELECT}

        ${whereClause}

        ORDER BY wr.created_at DESC

        LIMIT ? OFFSET ?
        `,
        [
            ...params,
            Number(limit),
            Number(offset)
        ]
    );

    // --------------------------------------------------------
    // Count
    // --------------------------------------------------------

    const [countRows] = await pool.execute(
        `
        SELECT COUNT(*) AS total

        FROM water_requests wr

        INNER JOIN users u
            ON wr.requested_by = u.user_id

        ${whereClause}
        `,
        params
    );

    return {
        requests: rows,
        total: Number(countRows[0]?.total || 0)
    };
};

// ============================================================
// UPDATE REQUEST STATUS
// ============================================================

export const updateWaterRequestStatus = async ({
    requestId,
    updatedBy,
    newStatus,
    remarks = null,
}) => {

    // --------------------------------------------------------
    // Get Current Request
    // --------------------------------------------------------

    const currentRequest = await getWaterRequestById(requestId);

    if (!currentRequest) {
        return null;
    }

    const oldStatus = currentRequest.status;

    // --------------------------------------------------------
    // Update Status
    // --------------------------------------------------------

    let updateQuery = `
        UPDATE water_requests
        SET
            status = ?,
            remarks = ?,
            updated_at = NOW()
    `;

    const updateParams = [
        newStatus,
        remarks
    ];

    // --------------------------------------------------------
    // Approval
    // --------------------------------------------------------

    if (newStatus === 'APPROVED') {

        updateQuery += `,
            approved_by = ?,
            approved_at = NOW()
        `;

        updateParams.push(updatedBy);
    }

    // --------------------------------------------------------
    // Completion
    // --------------------------------------------------------

    if (newStatus === 'COMPLETED') {

        updateQuery += `,
            completed_at = NOW()
        `;
    }

    updateQuery += `
        WHERE request_id = ?
    `;

    updateParams.push(requestId);

    await pool.execute(
        updateQuery,
        updateParams
    );

    // --------------------------------------------------------
    // Insert History
    // --------------------------------------------------------

    await pool.execute(
        `
        INSERT INTO water_request_history
        (
            request_id,
            updated_by,
            old_status,
            new_status,
            remarks,
            updated_at
        )
        VALUES
        (
            ?, ?, ?, ?, ?, NOW()
        )
        `,
        [
            requestId,
            updatedBy,
            oldStatus,
            newStatus,
            remarks
        ]
    );

    return getWaterRequestById(requestId);
};

// ============================================================
// GET REQUEST HISTORY
// ============================================================

export const getWaterRequestHistory = async (requestId) => {

    const [rows] = await pool.execute(
        `
        SELECT
            h.history_id,
            h.request_id,
            h.updated_by,
            u.full_name AS updated_by_name,

            h.old_status,
            h.new_status,
            h.remarks,
            h.updated_at

        FROM water_request_history h

        INNER JOIN users u
            ON h.updated_by = u.user_id

        WHERE h.request_id = ?

        ORDER BY h.updated_at ASC
        `,
        [requestId]
    );

    return rows;
};

// ============================================================
// REQUEST STATISTICS
// ============================================================

export const getWaterRequestStats = async ({
    districtCode = null,
    talukaCode = null,
    villageCode = null,
    requestedBy = null,
}) => {

    const conditions = [];
    const params = [];

    if (districtCode) {
        conditions.push('district_code = ?');
        params.push(districtCode);
    }

    if (talukaCode) {
        conditions.push('taluka_code = ?');
        params.push(talukaCode);
    }

    if (villageCode) {
        conditions.push('village_code = ?');
        params.push(villageCode);
    }

    if (requestedBy) {
        conditions.push('requested_by = ?');
        params.push(requestedBy);
    }

    const whereClause =
        conditions.length
            ? `WHERE ${conditions.join(' AND ')}`
            : '';

    const [rows] = await pool.execute(
        `
        SELECT

            COUNT(*) AS totalRequests,

            SUM(
                CASE
                    WHEN status = 'PENDING'
                    THEN 1 ELSE 0
                END
            ) AS pendingRequests,

            SUM(
                CASE
                    WHEN status = 'UNDER_REVIEW'
                    THEN 1 ELSE 0
                END
            ) AS underReviewRequests,

            SUM(
                CASE
                    WHEN status = 'APPROVED'
                    THEN 1 ELSE 0
                END
            ) AS approvedRequests,

            SUM(
                CASE
                    WHEN status = 'REJECTED'
                    THEN 1 ELSE 0
                END
            ) AS rejectedRequests,

            SUM(
                CASE
                    WHEN status = 'TANKER_ASSIGNED'
                    THEN 1 ELSE 0
                END
            ) AS tankerAssignedRequests,

            SUM(
                CASE
                    WHEN status = 'IN_PROGRESS'
                    THEN 1 ELSE 0
                END
            ) AS inProgressRequests,

            SUM(
                CASE
                    WHEN status = 'COMPLETED'
                    THEN 1 ELSE 0
                END
            ) AS completedRequests,

            SUM(
                CASE
                    WHEN status = 'CANCELLED'
                    THEN 1 ELSE 0
                END
            ) AS cancelledRequests,

            COALESCE(
                SUM(required_quantity_liters),
                0
            ) AS totalRequestedLiters

        FROM water_requests

        ${whereClause}
        `,
        params
    );

    const stats = rows[0] || {};

    return {
        totalRequests: Number(stats.totalRequests || 0),
        pendingRequests: Number(stats.pendingRequests || 0),
        underReviewRequests: Number(stats.underReviewRequests || 0),
        approvedRequests: Number(stats.approvedRequests || 0),
        rejectedRequests: Number(stats.rejectedRequests || 0),
        tankerAssignedRequests: Number(stats.tankerAssignedRequests || 0),
        inProgressRequests: Number(stats.inProgressRequests || 0),
        completedRequests: Number(stats.completedRequests || 0),
        cancelledRequests: Number(stats.cancelledRequests || 0),
        totalRequestedLiters: Number(stats.totalRequestedLiters || 0),
    };
};

// ============================================================
// DELETE / CANCEL REQUEST
// ============================================================

export const cancelWaterRequest = async ({
    requestId,
    updatedBy,
    remarks = null,
}) => {

    return updateWaterRequestStatus({
        requestId,
        updatedBy,
        newStatus: 'CANCELLED',
        remarks
    });
};