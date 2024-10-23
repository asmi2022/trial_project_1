const { default: mongoose } = require("mongoose");
const CommonRepo = require("../../../utils/common.repository");
const UserModel = require("../models/user.schema");

class UserRepo extends CommonRepo{
    constructor(){
        super(UserModel)
    }

    userWithRole = async (id) => {
        try {
            return await UserModel.aggregate([
                {
                    $match: {
                        _id: new mongoose.Types.ObjectId(id),
                        isDeleted: false,
                        status: "Active"
                    }
                },
                {
                    $lookup: {
                        from: "roles",
                        foreignField: "_id",
                        localField: "role",
                        as: "role",
                        pipeline: [
                            {
                                $match: {
                                    isDeleted: false,
                                    status: "Active"
                                }
                            },
                            {
                                $project: {
                                    display: 1,
                                    type: 1,
                                    role: 1
                                }
                            }
                        ]
                    }
                },
                {
                    $unwind: {
                        path: "$role", preserveNullAndEmptyArrays: false
                    }
                }
            ])
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new UserRepo();