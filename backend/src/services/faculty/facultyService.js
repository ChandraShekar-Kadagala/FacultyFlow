import Faculty from "../../models/Faculty.js";


export async function getAllFaculty() {

    return Faculty.find()
        .sort({ name: 1 });
}


export async function getFacultyById(
    facultyId
) {

    return Faculty.findOne({
        facultyId
    });
}


export async function createFaculty(
    facultyData
) {

    return Faculty.create(
        facultyData
    );
}


export async function updateFaculty(
    facultyId,
    updates
) {

    return Faculty.findOneAndUpdate(
        { facultyId },
        updates,
        {
            new: true,
            runValidators: true
        }
    );
}


export async function deactivateFaculty(
    facultyId
) {

    return Faculty.findOneAndUpdate(
        { facultyId },
        {
            status: "inactive"
        },
        {
            new: true,
            runValidators: true
        }
    );
}