import {
    getAllFaculty,
    getFacultyById,
    createFaculty,
    updateFaculty,
    deactivateFaculty
} from "../services/faculty/facultyService.js";


export async function getFacultyList(
    req,
    res,
    next
) {
    try {

        const faculty =
            await getAllFaculty();

        res.status(200).json({
            success: true,
            count: faculty.length,
            faculty
        });

    } catch (error) {

        next(error);
    }
}


export async function getFaculty(
    req,
    res,
    next
) {
    try {

        const { facultyId } =
            req.params;

        const faculty =
            await getFacultyById(
                facultyId
            );

        if (!faculty) {

            return res.status(404).json({
                success: false,
                message: "Faculty not found."
            });
        }

        res.status(200).json({
            success: true,
            faculty
        });

    } catch (error) {

        next(error);
    }
}


export async function addFaculty(
    req,
    res,
    next
) {
    try {

        const faculty =
            await createFaculty(
                req.body
            );

        res.status(201).json({
            success: true,
            message: "Faculty created successfully.",
            faculty
        });

    } catch (error) {

        next(error);
    }
}


export async function editFaculty(
    req,
    res,
    next
) {
    try {

        const { facultyId } =
            req.params;

        const faculty =
            await updateFaculty(
                facultyId,
                req.body
            );

        if (!faculty) {

            return res.status(404).json({
                success: false,
                message: "Faculty not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Faculty updated successfully.",
            faculty
        });

    } catch (error) {

        next(error);
    }
}


export async function deactivateFacultyMember(
    req,
    res,
    next
) {
    try {

        const { facultyId } =
            req.params;

        const faculty =
            await deactivateFaculty(
                facultyId
            );

        if (!faculty) {

            return res.status(404).json({
                success: false,
                message: "Faculty not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Faculty deactivated successfully.",
            faculty
        });

    } catch (error) {

        next(error);
    }
}