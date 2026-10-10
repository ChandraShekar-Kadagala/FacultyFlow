import {
    getDashboardSummary
} from "../services/admin/dashboardService.js";


// ============================================================
// GET DASHBOARD SUMMARY
// ============================================================

export async function getDashboardSummaryController(
    req,
    res,
    next
) {

    try {

        const summary =
            await getDashboardSummary();


        return res.status(200).json({

            success: true,

            summary

        });

    } catch (error) {

        next(error);

    }

}