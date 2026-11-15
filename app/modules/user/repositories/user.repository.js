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

    getAll = async(req)=>{
        try {
            let query = { isDeleted: false, role: req.body.role };
            if(req.body.status){
                query['status'] = req.body.status
            }
            let sortField = req.body.sortField || 'name';
            let sortOperator = {
                $sort: {
                    [sortField]: 1
                } 
            }
            if(req.body.sortOrder && req.body.sortOrder == "desc"){
                sortOperator.$sort[sortField] = -1
            }
            return await UserModel.aggregate([
                {
                    $match: query
                },
                sortOperator
            ])
        } catch (error) {
            throw 
        }
    }
}

module.exports = new UserRepo();