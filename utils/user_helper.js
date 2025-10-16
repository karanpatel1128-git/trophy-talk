import crypto from 'crypto';
import base64url from 'base64url';
import bcrypt from 'bcrypt';
import Msg from '../utils/message.js';
import { handleError, handleSuccess } from '../utils/responseHandler.js';
import jwt from 'jsonwebtoken';
import path from 'path';
import handlebars from 'handlebars';
import fs from 'fs/promises';
import { sendEmail } from '../utils/emailService.js';
import { insertUserNotifications, updateUsersProfile } from '../models/user.model.js';
import admin from 'firebase-admin';
const serviceAccount = JSON.parse(
    await fs.readFile(new URL('../utils/serviceAccountKey.json', import.meta.url))
);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}


export const capitalizeFirstLetterOfWords = (str) => {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
};

export const randomStringAsBase64Url = (size) => {
    return base64url(crypto.randomBytes(size));
};

export const generateToken = (user) => {
    console.log('user>>>>>>>>>>>>>>>',user);
    
    return jwt.sign(
        {
            data: {
                id: user.id,
            },
        },
        process.env.AUTH_SECRETKEY,
        { expiresIn: "1d" }
    );
};

// Function to authenticate user and return token
export const authenticateUser = async (res, email, password, userData, fcmToken, moduleType) => {
    if (!userData || userData.length === 0) {
        return handleError(res, 400, Msg.accountNotFound, []);
    }
    const user = userData[0];
    if (email !== user.email) {
        return handleError(res, 400, Msg.accountNotFound, []);
    }
    const match = bcrypt.compareSync(password, user.password);
    if (!match) {
        return handleError(res, 400, Msg.invalidPassword, []);
    }
    if (moduleType == "userLogin") {
        let data = { fcmToken: fcmToken }
        await updateUsersProfile(data, user.id);
    }
    const jwt_token = generateToken(user);
    return handleSuccess(res, 200, Msg.loginSuccess, jwt_token);
};

// Function to hash a password
export const hashPassword = async (password) => {
    try {
        const saltRounds = 12;
        return await bcrypt.hash(password, saltRounds);
    } catch (error) {
        console.error("Error hashing password:", error);
        throw new Error("Password hashing failed");
    }
};

// Function to compare passwords
export const comparePassword = async (password, hashedPassword) => {
    try {
        return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
        console.error("Error comparing passwords:", error);
        throw new Error("Password comparison failed");
    }
};

export const sendHtmlResponse = (res, statusCode, message) => {
    res.status(statusCode).send(`
        <div style="text-align: center; padding: 20px;">
            <h3>${message}</h3>
        </div>
    `);
};

export const generateRandomString = async (length) => {
    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

export const sendVerificationEmail = async ({ email, code, res }) => {
    const context = {
        verification_code: code,
        msg: Msg.verifiedMessage,
    };
    const projectRoot = path.resolve();
    const emailTemplatePath = path.join(projectRoot, "views", "otp_verification.handlebars");
    const templateSource = await fs.readFile(emailTemplatePath, "utf-8");
    const template = handlebars.compile(templateSource);
    const emailHtml = template(context);

    const emailOptions = {
        to: email,
        subject: Msg.accountActivate,
        html: emailHtml,
    };
    await sendEmail(emailOptions);
    if (res) {
        return handleSuccess(res, 200, `${Msg.accountVerifiedCodeSent}.`);
    }
    return { success: true, message: `${Msg.accountVerifiedCodeSent}.` };
};

// export const sendNotification = async (message) => {
//     try {
//         const response = await admin.messaging().send(message);
//         const status = response.failureCount > 0 ? 'failed' : 'success';
//         const responseText = JSON.stringify(response);
//         await insertUserNotifications(message, status, responseText);
//         if (status === 'failed') {
//             const failedTokens = [];
//             response.responses.forEach((resp, idx) => {
//                 if (!resp.success) {
//                     failedTokens.push(message.token);
//                 }
//             });
//             return (success = false, `${Msg.notificationSendFailed}.`, { failedTokens });
//         } else {
//             return (success = true, `${Msg.notificationSentSuccessfull}.`, response);
//         }
//     } catch (error) {
//         return (success = false, `${Msg.unableToSendNotification}`, error);
//     }
// };

export const sendNotification = async (message,postId) => {
    try {
        postId=postId?postId:null
        await insertUserNotifications(message, "success",postId);
        const response = await admin.messaging().send(message);
        const responseText = JSON.stringify(response);
        return { success: true, message: Msg.notificationSentSuccessfull, data: response };
    } catch (error) {
        return { success: false, message: Msg.unableToSendNotification, error: error.message || error };
    }
};


// export const sendNotification = async (message) => {
//     try {
//         console.log('message',message);
        
//         let response;
//         if (Array.isArray(message.token)) {
//             response = await admin.messaging().sendMulticast(message);
//         } else {
//             response = await admin.messaging().send(message);
//         }
//         console.log('response',response);
        
//         const responseText = JSON.stringify(response);
//         await insertUserNotifications(message, "success", responseText);
//         if (response.failureCount && response.failureCount > 0) {
//             const failedTokens = [];
//             response.responses.forEach((resp, idx) => {
//                 if (!resp.success) {
//                     failedTokens.push(message.token[idx]);
//                 }
//             });
//             return { success: false, message: Msg.notificationSendFailed, failedTokens, };
//         }
//         return { success: true, message: Msg.notificationSentSuccessfull, data: response, };
//     } catch (error) {
//         return { success: false, message: Msg.unableToSendNotification, error: error.message || error, };
//     }
// };

// export const createNotificationMessage = async ({ followerName, id, userId, followId, usersfetchFcmToken, notificationType }) => {
//     return {
//         notification: {
//             title: `${followerName} ${Msg.hasFollowingYou}`,
//             body: `${followerName} ${Msg.hasFollowCheckProfile}`
//         },
//         data: {
//             sendFrom: String(id),
//             sendTo: String(userId),
//             followId: String(followId),
//             notificationType: String(notificationType)
//         },
//         token: usersfetchFcmToken
//     };
// };



// export const sendNotification = async (message) => {
//     try {
//         console.log('Sending message:', JSON.stringify(message, null, 2));

//         let response;
//         if (Array.isArray(message.tokens)) {
//             response = await admin.messaging().sendMulticast(message);
//         } else {
//             response = await admin.messaging().send(message);
//         }

//         console.log('FCM Response:', JSON.stringify(response, null, 2));

//         await insertUserNotifications(message, "success", JSON.stringify(response));

//         if (response.failureCount && response.failureCount > 0) {
//             const failedTokens = response.responses
//                 .map((resp, idx) => (!resp.success ? message.tokens[idx] : null))
//                 .filter(Boolean);
//             return { success: false, message: Msg.notificationSendFailed, failedTokens };
//         }

//         return { success: true, message: Msg.notificationSentSuccessfull, data: response };
//     } catch (error) {
//         console.error('FCM Error:', error);
//         return { success: false, message: Msg.unableToSendNotification, error: error.message || error };
//     }
// };


export const createNotificationMessage = async ({
    notificationSend,
    fullName,
    id,
    userId,
    followId,
    usersfetchFcmToken,
    notificationType,
    postId
}) => {
    let notification = {};
    switch (notificationSend) {
        case 'followToAnotherUsers':
            notification = {
                title: `${fullName} ${Msg.hasFollowingYou}`,
                body: `${fullName} ${Msg.hasFollowCheckProfile}`
            };
            break;

        case 'commentsOnPost':
            notification = {
                title: `${fullName} ${Msg.commentOnPosts}`,
                body: `${fullName} ${Msg.hasCommentedCheckPost}`
            };
            break;

        case 'likedPost':
            notification = {
                title: `${fullName} ${Msg.likeOnPost}`,
                body: `${fullName} ${Msg.hasLikedCheckPost}`
            };
            break;

        default:
            notification = {
                title: `${fullName} ${Msg.hasFollowingYou}`,
                body: `${fullName} ${Msg.hasFollowCheckProfile}`
            };
            break;
    }
    return {
        notification,
        data: {
            sendFrom: String(id || ""),
            sendTo: String(userId || ""),
            followId: String(followId || ""),
            notificationType: String(notificationType || ""),
            postId: String(postId || "")
        },
        token: usersfetchFcmToken || ""
    };
};

// export const sendNotification = async (message) => {
//     // try {
//         console.log('message:',message);
//         if (!message.token) {
//             console.error("❌ Error: No FCM token provided!");
//             return { success: false, message: "No FCM token provided" };
//         }
//         let response;
//         if (Array.isArray(message.token)) {  
//             response = await admin.messaging().sendMulticast({
//                 tokens: message.token,  // ✅ Fix: Use 'tokens' instead of 'token' for multicast
//                 notification: message.notification,
//                 data: message.data
//             });
//         } else {
//             response = await admin.messaging().send({
//                 token: message.token,  // ✅ Fix: Use 'token' for single send
//                 notification: message.notification,
//                 data: message.data
//             });
//         }
// console.log('message',message);

//         const responseText = JSON.stringify(response);
//         console.log('response',response);
        
//         await insertUserNotifications(message, "success", responseText);

//         if (response.failureCount && response.failureCount > 0) {
//             return { success: false, message: "Notification send failed", failedTokens: response.failureCount };
//         }

//         return { success: true, message: "Notification sent successfully", data: response };
//     // } catch (error) {
//     //     console.error("❌ Notification Send Error:", error);
//     //     return { success: false, message: "Unable to send notification", error: error.message || error };
//     // }
// };


