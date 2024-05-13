const App_Status = require("../contact/contact")
const JWT = require("jsonwebtoken")
const bcryptjs = require("bcryptjs");
const adminTable = require("../models/Admin");
const { response } = require("express");
const userTable = require("../models/user");
const testsubmitTable = require("../models/testsubmit");

const loginAdmin = async (request, response) => {
    try {
        let { email, password } = request.body;

        let theUserObj = await adminTable.findOne({ email: email });
        if (!theUserObj) {
            return response.status(401).json({
                status: App_Status.Failed,
                message: "Invalid Email",
                data: null
            });
        }

        let isMatch = await bcryptjs.compare(password, theUserObj.password);
        if (!isMatch) {
            return response.status(401).json({
                status: App_Status.Failed,
                message: "Invalid Password",
                data: null
            });
        }

        let payload = {
            id: theUserObj._id,
            email: theUserObj.email,
            password: theUserObj.password
        };

        let secretKey = process.env.SECRET_KEY;

        if (payload && secretKey) {
            let token = JWT.sign(payload, secretKey, { expiresIn: "1h" });
            const AdminLogin = {
                _id: theUserObj._id,
                email: theUserObj.email
            }
            return response.status(200).json({
                status: App_Status.Success,
                message: "Admin Login Successfully",
                data: AdminLogin,
                token: token
            });
        }
    } catch (error) {
        return response.status(500).json({
            status: App_Status.Failed,
            message: "Internal Server Error",
            data: null
        });
    }
};

const getTestDetails = async (user) => {
    const userTests = await testsubmitTable.find({ userId: user._id }); // Get all the user's test submissions
    let totalQuestions = 0; // Total number of questions attempted
    let totalCorrectAnswer = 0; // Total number of correct answers
    let totalWrongAnswer = 0; // Total number of wrong answers

    userTests.forEach(test => { // Iterate over the user's test submissions
        test.questions.forEach(question => { // Iterate over the questions of the current test submission
            totalQuestions++; // Increment the total number of questions
            if (question.selectedOption === question.correctOption) { // If the selected option is correct
                totalCorrectAnswer++; // Increment the total number of correct answers
            } else { // If the selected option is wrong
                totalWrongAnswer++; // Increment the total number of wrong answers
            }
        });
    });

    const percentage = (totalCorrectAnswer / totalQuestions) * 100 || 0; // Calculate the percentage of correct answers

    return { // Return the user's test details
        username: user.userName, // Username
        useremail: user.email, // User email
        totalTest: userTests.length, // Total number of tests taken
        totalQuestions, // Total number of questions attempted
        totalCorrectAnswer, // Total number of correct answers
        totalWrongAnswer, // Total number of wrong answers
        percentage // Percentage of correct answers
    };
}

// const userlist = async (req, res) => {
//     try {
//         // If admin access the api
//         if (req.isAdmin) {
//             // Filter the user list based on query params
//             let filter = {};
//             if (req?.query?.id) {
//                 filter = { _id: req?.query?.id }
//             }

//             // Find user list from database
//             const userList = await userTable.find(filter, "userName email");
//             // Format the user list
//             const formattedUserList = await Promise.all(userList.map(async user => {
//                 return await getTestDetails(user)
//             }));

//             // Return the user list
//             res.status(200).json({
//                 status: App_Status.Success,
//                 message: "User list retrieved successfully",
//                 data: formattedUserList
//             });
//         } else if (req?.userid === req?.query?.id) {
//             // Find user from database
//             const user = await userTable.findOne({ _id: req?.userid }, "userName email")?.lean();
//             // Format the user list
//             const formattedUserList = await getTestDetails(user)

//             // Return the user list
//             res.status(200).json({
//                 status: App_Status.Success,
//                 message: "User list retrieved successfully",
//                 data: formattedUserList
//             });
//         } else {
//             // If user id is not matched with params
//             res.status(404).json({
//                 status: App_Status.Failed,
//                 message: "User id is not matched with params",
//             });
//         }
//     } catch (error) {
//         // Print the error
//         console.error("Error:", error);
//         // Return the error
//         res.status(500).json({
//             status: App_Status.Failed,
//             message: "Internal Server Error",
//             data: error
//         });
//     }
// }

const userlist = async (req, res) => {
    // console.log(req);
    try {
        if (req.isAdmin || req.userid === req.query.id) {
            const filter = req.query.id ? { _id: req.userid } : {};
            console.log("Filter:", filter);
            console.log("Query Parameters:", req.query);
            const userList = await userTable.find(filter, "userName email");
            if (userList.length === 0 && req.query.id) {
                res.status(404).json({
                    status: App_Status.Failed,
                    message: "User not found",
                    data: null
                });
            } else {
                const formattedUserList = await Promise.all(userList.map(getTestDetails));
                res.status(200).json({
                    status: App_Status.Success,
                    message: "User list retrieved successfully",
                    data: formattedUserList
                });
            }
        } else {
            res.status(404).json({
                status: App_Status.Failed,
                message: "User id is not matched with params",
                data: null
            });
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({
            status: App_Status.Failed,
            message: "Internal Server Error",
            data: error
        });
    }
}


// admin token : never give password in response
// admin create question : only admin token can create
// admin create test :  only admin token can create
// Proper validation in message string
// remove image required from modal
// "Question updated SuccessFully",
// - only admin token can access admin related APIs
// - make api names appropriate- name should not indicate the action
// - +911212121212 after reg-  it removes + sign from phon number. please solve it.
// - test must be have atleast 2 answers to save.
// - save test result while submitting the answers , save info in the same collection.

module.exports = {
    loginAdmin,
    userlist
}
