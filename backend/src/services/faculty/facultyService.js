import Faculty from "../../models/Faculty.js";


export async function getAllFaculty() {

    return Faculty.find()
        .sort({ name: 1 });
}


export async function getFacultyById(
    identifier
) {
    if (!identifier) {
        return null;
    }

    return Faculty.findOne({
        $or: [
            { facultyId: identifier },
            { userId: identifier },
            { employeeCode: identifier }
        ]
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
    identifier,
    updates
) {

    return Faculty.findOneAndUpdate(
        {
            $or: [
                { facultyId: identifier },
                { userId: identifier }
            ]
        },
        updates,
        {
            new: true,
            runValidators: true
        }
    );
}


export async function deactivateFaculty(
    identifier
) {

    return Faculty.findOneAndUpdate(
        {
            $or: [
                { facultyId: identifier },
                { userId: identifier }
            ]
        },
        {
            status: "inactive"
        },
        {
            new: true,
            runValidators: true
        }
    );
}