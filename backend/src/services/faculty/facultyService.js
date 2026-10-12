import Faculty from "../../models/Faculty.js";
import User from "../../models/User.js";

export async function getAllFaculty() {
    return Faculty.find()
        .sort({ name: 1 });
}

export async function getFacultyById(identifier) {
    if (!identifier) {
        return null;
    }

    let faculty = await Faculty.findOne({
        $or: [
            { facultyId: identifier },
            { userId: identifier },
            { employeeCode: identifier }
        ]
    });

    if (!faculty) {
        // Legitimate identity link: If a User exists with role: 'faculty', ensure synchronized Faculty record
        const user = await User.findOne({
            role: "faculty",
            $or: [
                { facultyId: identifier },
                { userId: identifier },
                { employeeCode: identifier },
                { email: String(identifier).toLowerCase() }
            ]
        });

        if (user) {
            faculty = await Faculty.findOne({
                $or: [
                    { facultyId: user.facultyId || user.userId },
                    { userId: user.userId }
                ]
            });

            if (!faculty) {
                try {
                    faculty = await Faculty.create({
                        facultyId: user.facultyId || user.userId,
                        userId: user.userId,
                        employeeCode: user.employeeCode || `EMP-${user.facultyId || user.userId}`,
                        name: user.name,
                        department: user.department || "General",
                        designation: user.designation || "Faculty",
                        status: user.status || "active"
                    });
                } catch (createErr) {
                    if (createErr.code === 11000) {
                        faculty = await Faculty.findOne({
                            $or: [
                                { facultyId: user.facultyId || user.userId },
                                { userId: user.userId }
                            ]
                        });
                    } else {
                        throw createErr;
                    }
                }
            }
        }
    }

    return faculty;
}

export async function createFaculty(facultyData) {
    return Faculty.create(facultyData);
}

export async function updateFaculty(identifier, updates) {
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

export async function deactivateFaculty(identifier) {
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
