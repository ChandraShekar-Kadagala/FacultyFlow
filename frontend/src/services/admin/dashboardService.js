import apiRequest
    from "../api/apiClient";


// ============================================================
// GET ADMIN DASHBOARD SUMMARY
// ============================================================

export async function getAdminDashboardSummary(
    token
) {

    return apiRequest(
        "/admin/dashboard/summary",
        {
            method: "GET",
            token
        }
    );

}