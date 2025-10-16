import dotenv from 'dotenv';
import Msg from '../utils/message.js';
import path from 'path';
import handlebars from 'handlebars';
import fs from 'fs/promises';
import bcrypt from 'bcrypt';
import { sendEmail } from '../utils/emailService.js';
import { mediaTypes, NotificationTypes, variableTypes } from '../utils/constant.js';
import { handleError, handleSuccess } from '../utils/responseHandler.js';
import {
    isUsersExistsOrNot,
    userRegistration,
    updateUserForgotPasswordOtp,
    updateUserPassword,
    fetchUsersById,
    changePassword,
    updateUsersProfile,
    updateUserOtp,
    updateUsersByOtp,
    fetchBlockedUsersDetailed,
    create_blocked,
    unblockedToUsers,
    fetchBlockedListUsers,
    insertFollowersUsers,
    retrieveMyFollowers,
    retrieveMyFollowing,
    isUsersFollowToAnotherUsers,
    unFollow,
    fetchThereOwnPostModel,
    fetchOtherPostModel,
    fetchUsersLikeToPostDataByUsersId,
    UsersUnLikeToPost,
    addUserLikeToPost,
    fetchLikeOnParticularPost,
    userViewOtherPost,
    fetchTotalViewsOnPost,
    isAllreadyUserViewThePost,
    createNewPosts,
    fetchUsersNotificationByUsersId,
    fetchAllUsersModel,
    fetchBlockedByUsersIdAndCurrentUserLogin,
    accountDeleteModel,
    addCommentsOnParticularPost,
    fetchCommentAccordingToParentCommentId,
    fetchCommentAccordingToPostId,
    addLikesOnParticularCommentPost,
    fetchLikeOnPostCommentedByUsersId,
    UsersUnLikeToCommentedPost,
    pushNotificationOff,
    pushNotificationOn,
    giveAwayAnnoucmentOff,
    giveAwayAnnoucmentOn,
    deletePostByCommentsId,
    fetchUsersByPostId,


} from '../models/user.model.js';
import {
    sendNotification, authenticateUser,
    hashPassword, createNotificationMessage, comparePassword,
    sendVerificationEmail, generateToken,
} from '../utils/user_helper.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { getPublicUrl } from '../middleware/upload.js'

dotenv.config();


export const userSignUp = async (req, res) => {
    try {
        const { fullName, username, email, password, isSignUpMe } = req.body;
        const code = Math.floor(1000 + Math.random() * 9000);
        const data = await isUsersExistsOrNot(email);
        if (data.length !== 0) {
            return handleError(res, 400, Msg.allreadyHaveAccount, []);
        } else {
            const hash = await hashPassword(password);
            const user = {
                fullName,
                userName: username,
                email: email.toLowerCase(),
                code: code,
                password: hash,
                isSignUpMe,
            };
            let create_user = await userRegistration(user);
            if (create_user) {
                await sendVerificationEmail({ email, code, res });
            } else {
                return handleSuccess(res, 400, `${Msg.failedToUsersCreate}`);
            }
        }
    } catch (error) {
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const resendOtp = async (req, res) => {
    try {
        const { email, isForgotPasswordPage } = req.body;
        let isUserExists = await isUsersExistsOrNot(email)
        const code = Math.floor(1000 + Math.random() * 9000);
        if (isUserExists.length > 0) {
            if (isForgotPasswordPage == 1) {
                await updateUserForgotPasswordOtp(code, email)
                await sendVerificationEmail({ email, code, res });
            } else {
                await updateUserOtp(code, email)
                await sendVerificationEmail({ email, code, res });
            }
        } else {
            return handleError(res, 400, Msg.USER_NOT_FOUND);
        }
    } catch (err) {
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const otpVerified = async (req, res) => {
    try {
        const { email, otp, isForgotPasswordPage } = req.body;
        let isUserExists = await isUsersExistsOrNot(email)
        if (isUserExists.length > 0) {
            if (isForgotPasswordPage == 1) {
                if (isUserExists[0].forgotPasswordOtp == otp) {
                    return handleSuccess(res, 200, `${Msg.otpVerified}.`);
                } else {
                    return handleError(res, 400, Msg.invalidOtp);
                }
            } else {
                if (isUserExists[0].code == otp) {
                    await updateUsersByOtp(isUserExists[0]?.id);
                    return handleSuccess(res, 200, `${Msg.otpVerified}.`);
                } else {
                    return handleError(res, 400, Msg.invalidOtp);
                }
            }
        } else {
            return handleError(res, 400, Msg.USER_NOT_FOUND);
        }
    } catch (err) {
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const userSignIn = async (req, res) => {
    try {
        let moduleType = "userLogin"
        const { email, password, fcmToken } = req.body;
        const userData = await isUsersExistsOrNot(email);
        return authenticateUser(res, email, password, userData, fcmToken, moduleType);
    } catch (error) {
        console.error(error);
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const data = await isUsersExistsOrNot(email);
        if (data.length > 0) {
            const code = Math.floor(1000 + Math.random() * 9000);
            await updateUserForgotPasswordOtp(code, email);
            const context = {
                OTP: code,
                msg: Msg.verifiedMessage,
            };
            const projectRoot = path.resolve(__dirname, "../");
            const emailTemplatePath = path.join(projectRoot, "views", "forget_template.handlebars");
            const templateSource = await fs.readFile(emailTemplatePath, "utf-8");
            const template = handlebars.compile(templateSource);
            const emailHtml = template(context);
            const emailOptions = {
                to: email,
                subject: Msg.forgotPassword,
                html: emailHtml,
            };
            await sendEmail(emailOptions);
            return handleSuccess(res, 200, `${Msg.forgotPasswordOtpSend}.`);
        } else {
            return handleError(res, 400, Msg.emailNotFound, []);
        }
    } catch (error) {
        console.error(error);
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const changeForgotPassword = async (req, res) => {
    try {
        const { email, password, confirm_password } = req.body;
        if (password == confirm_password) {
            const data = await isUsersExistsOrNot(email);
            if (data.length !== 0) {
                const hash = await bcrypt.hash(password, 12);
                const result2 = await updateUserPassword(hash, email);
                if (result2.affectedRows) {
                    return handleSuccess(res, 200, `${Msg.passwordChanged}.`);
                }
            } else {
                return handleError(res, 400, Msg.emailNotFound, []);
            }
        } else {
            return handleError(res, 400, Msg.passwordAndConfirmPasswordNotMatch, []);
        }
    } catch (error) {
        console.error(error);
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const resetPassword = async (req, res) => {
    try {
        let {
            old_password,
            new_password,
            confirm_password
        } = req.body
        let { id } = req.user
        const data = await fetchUsersById(id);
        if (data.length > 0) {
            const match = await comparePassword(old_password, data[0].password);
            if (match) {
                if (new_password == confirm_password) {
                    const hash = await hashPassword(confirm_password);
                    let result = await changePassword(hash, id)
                    if (result.affectedRows) {
                        return handleSuccess(res, 200, Msg.passwordChanged);
                    } else {
                        return handleError(res, 400, Msg.passwordNotChanged);
                    }
                } else {
                    return handleError(res, 400, Msg.passwordsDoNotMatch);
                }
            } else {
                return handleError(res, 400, Msg.currentPasswordIncorrect, []);
            }
        } else {
            return handleError(res, 400, Msg.dataNotFound, []);
        }
    } catch (error) {
        console.error(error);
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const getUserProfile = async (req, res) => {
    try {
        let { id } = req.user
        let { userId } = req.query
        let usersId = userId ? userId : id;
        let checkUser = await fetchUsersById(usersId);
        checkUser.map((item) => {
            item.profileImage = item.profileImage != null ? item.profileImage : null
            item.backgroundImage = item.backgroundImage != null ? item.backgroundImage : null
            return item
        })
        let isBlocked;
        if (userId) {
            let isBlockedUsers = await fetchBlockedByUsersIdAndCurrentUserLogin(id, userId);
            isBlocked = isBlockedUsers.length > 0 ? true : false
        }
        let myFollowers = await retrieveMyFollowers(usersId);
        let myFollowings = await retrieveMyFollowing(usersId)
        let check = myFollowers.some(item => item.followersId === id) ? myFollowers.filter(item => item.followersId === id) : false;
        checkUser[0].myFollowers = myFollowers.length > 0 ? myFollowers.length : 0
        checkUser[0].myFollowings = myFollowings.length > 0 ? myFollowings.length : 0
        checkUser[0].isFollow = check.length > 0 ? true : false
        checkUser[0].isBlocked = isBlocked ? isBlocked : null
        return handleSuccess(res, 200, Msg.userDetailedFoundSuccessfully, checkUser[0]);
    } catch (error) {
        console.error(error);
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const editProfile = async (req, res) => {
    try {
        let { id } = req.user
        let profileImg = "";
        let backgroundImage = "";
        if (req.files) {
            profileImg = req.files.profileImage ? getPublicUrl(req.files.profileImage[0].key) : null;
            backgroundImage = req.files.backgroundImage ? getPublicUrl(req.files.backgroundImage[0].key) : null
        }
        let [isUserExists] = await fetchUsersById(id)
        const userProfile = {
            userName: req.body?.userName ?? isUserExists.userName,
            fullName: req.body?.fullName ?? isUserExists.fullName,
            bio: req.body?.bio ?? isUserExists.bio,
            huntingTitle: req.body?.huntingTitle ?? isUserExists.huntingTitle,
            location: req.body?.location ?? isUserExists?.location,
            profileImage: profileImg == null ? isUserExists.profileImage : profileImg,
            backgroundImage: backgroundImage == null ? isUserExists.backgroundImage : backgroundImage,
            address: req.body?.address ?? isUserExists.address,
        };
        const result = await updateUsersProfile(userProfile, id);
        return handleSuccess(res, 200, Msg.profileUpdatedSuccessfully, result);
    } catch (err) {
        console.error(err);
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const blockedToAnotherUsers = async (req, res) => {
    try {
        let { userId } = req.body
        let { id } = req.user
        let obj = {
            blocked_from: id,
            blocked_to: userId
        }
        await create_blocked(obj);
        return handleSuccess(res, 200, Msg.userBlockedSuccessfully);
    } catch (error) {
        console.error(error);
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const unblockedToAnotherUsers = async (req, res) => {
    try {
        let { id } = req.user
        let { userId } = req.body
        await unblockedToUsers(id, userId)
        return handleSuccess(res, 200, Msg.userUnBlockedSuccessfully);
    } catch (error) {
        console.error(error);
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const fetchBlockedList = async (req, res) => {
    try {
        let { id } = req.user
        let result = await fetchBlockedListUsers(id);
        if (result.length > 0) {
            let blockedToIds = result.map(user => user.blocked_to);
            let blocked_user_data_fetch = await fetchBlockedUsersDetailed(blockedToIds);
            // result.forEach(blockedUser => {
            //     const blockedToId = blockedUser.blocked_to;
            //     console.log('blockedToId>>>>>>>>>>',blockedToId);

            //     const userDetails = blocked_user_data_fetch.find(user => user.id === blockedToId);
            //     console.log('userDetails', userDetails);

            //     let profileImage = userDetails.profileImage
            //     let img
            //     if (profileImage !== null) {
            //        
            //     } else {
            //         img = null
            //     }

            //     if (userDetails) {
            //         blockedUser.fullName = userDetails.fullName;
            //         // blockedUser.dob = userDetails.dob;
            //         blockedUser.profileImage = img
            //         const timestamp = blocked_user_data_fetch[0].createdAt;
            //         if (timestamp) {
            //             const dateOnly = (timestamp instanceof Date ? timestamp.toISOString() : timestamp).split('T')[0];
            //             blockedUser.date = dateOnly;
            //         } else {
            //             blockedUser.date = null;
            //         }
            //     }
            // });
            // result.date = result.length > 0 && result.createdAt ? (result.createdAt instanceof Date ? result.createdAt.toISOString() : result.createdAt).split('T')[0] : null
            return handleSuccess(res, 200, Msg.dataFoundSuccessful, blocked_user_data_fetch);
        } else {
            return handleError(res, 400, Msg.USER_NOT_FOUND, []);
        }
    } catch (error) {
        console.log(';error', error);
        return res.status(500).send({
            status: false,
            message: Msg.err
        });
    }
};

export const socialLogin = async (req, res) => {
    try {
        const { email, socialId, userName, fcmToken, socialProvider } = req.body;
        const data = await isUsersExistsOrNot(email);
        if (data.length !== 0) {
            let obj = {
                socialProvider, socialId, fcmToken
            }
            await updateUsersProfile(obj, data[0].id)
            const token = generateToken(data[0]);
            return handleSuccess(res, 200, Msg.loginSuccess, token);
        } else {
            const user = {
                email,
                socialId,
                userName,
                fcmToken,
                socialProvider,
                isVerified: 1
            };
            const create_user = await userRegistration(user);
            const user_id = { id: create_user.insertId }
            let id = user_id.id
            const token = generateToken(user_id);
            let responseData = {
                token, id
            }
            return handleSuccess(res, 200, Msg.loginSuccess, token);
        }
    } catch (error) {
        console.error(error);
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const follow = async (req, res) => {
    try {
        let { userId } = req.body
        let { id, fullName } = req.user
        let fetchFcmToken = await fetchUsersById(userId);
        let data = {
            followersId: id,
            followingId: userId
        }
        let savedFollowingUsers = await insertFollowersUsers(data);
        if (savedFollowingUsers.insertId == 0) {
            return handleError(res, 400, Msg.requestNotSent);
        }
        let usersfetchFcmToken = fetchFcmToken[0].fcmToken
        let notificationType = NotificationTypes.FOLLOWER_NOTIFICATION
        let followId = savedFollowingUsers.insertId
        let notificationSend = 'followToAnotherUsers'
        let postId = null
        let message = await createNotificationMessage({ notificationSend, fullName, id, userId, followId, usersfetchFcmToken, notificationType, postId });
        // let message = await createNotificationMessage({ notificationSend, fullName, id, userId, followId, fetchFcmToken: { fcmToken: usersfetchFcmToken }, notificationType });
        await sendNotification(message);
        return handleSuccess(res, 200, Msg.followSuccess);
    } catch (error) {
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const retrieveUserFollowersAndFollowing = async (req, res) => {
    try {
        let { id } = req.user
        let { isFollower, userId } = req.query
        let usersId = userId ? userId : id;
        let data;
        if (isFollower == 1) {
            data = await retrieveMyFollowers(usersId)
        } else {
            data = await retrieveMyFollowing(usersId)
        }
        if (data.length > 0) {
            data = await Promise.all(
                data.map(async (item) => {
                    let userId = item.followersId ? item.followersId : item.followingId
                    let isFollower = await isUsersFollowToAnotherUsers(id, userId)
                    let userDeatils = await fetchUsersById(userId)
                    let isSelf = false
                    if (id == userId) {
                        isSelf = true
                    }
                    item.isSelf = isSelf;
                    item.userId = userId;
                    item.isFollower = isFollower.length > 0 ? true : false;
                    item.userName = userDeatils[0].fullName
                    item.huntingTitle = userDeatils[0].huntingTitle
                    item.profileImage = userDeatils[0].profileImage != null ? userDeatils[0].profileImage : null
                    return item
                })
            )
            return handleSuccess(res, 200, Msg.dataFoundSuccessful, data);
        } else {
            return handleError(res, 400, Msg.USER_NOT_FOUND, []);
        }
    } catch (error) {
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const unfollow = async (req, res) => {
    try {
        let { id } = req.user
        let { userId } = req.body
        await unFollow(id, userId)
        return handleSuccess(res, 200, Msg.unFollowedToUsers);
    } catch (error) {
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const fetchMyPostByUserId = async (req, res) => {
    try {
        let { id } = req.user
        let { userId } = req.query
        let usersId = userId ? userId : id;
        let fetchThereOwnPost = await fetchThereOwnPostModel(usersId)
        if (fetchThereOwnPost.length > 0) {
            // let isFollower = false;
            // let fetchFollowingId = await retrieveMyFollowing(id);
            // const followingIds = fetchFollowingId.map(i => i.followingId);
            fetchThereOwnPost = await Promise.all(
                fetchThereOwnPost.map(async (item) => {
                    // if (item.audiance === mediaTypes.EVERYONE || followingIds.includes(item.userId)) {
                    // if (item.audiance === mediaTypes.EVERYONE) {
                    //     let listOfFollowers = await isUsersFollowToAnotherUsers(id, item.userId);
                    //     isFollower = Array.isArray(listOfFollowers) && listOfFollowers.length > 0;
                    // } else {
                    //     isFollower = true;
                    // }
                    // item.isFollower = isFollower;
                    let tagPeople = [];
                    let tagsPeople = item.tagPeople ? (typeof item.tagPeople === "string" ? JSON.parse(item.tagPeople) : item.tagPeople) : []; // Ensure it's an array

                    if (Array.isArray(tagsPeople) && tagsPeople.length > 0) {
                        tagPeople = await Promise.all(
                            tagsPeople.map(async (i) => ({
                                userId: i,
                                userDetails: await fetchUsersById(i)
                            }))
                        );
                    }
                    let postId = item.id
                    let totalComments = 0;
                    let fetchCommentsByPostId = await fetchCommentAccordingToPostId(postId);
                    if (fetchCommentsByPostId.length > 0) {
                        let fetchTotalPostComments = fetchCommentsByPostId.length;
                        let totalNestedComments = 0;
                        fetchCommentsByPostId = await Promise.all(
                            fetchCommentsByPostId.map(async (comment) => {
                                let nestedComments = await fetchCommentAccordingToParentCommentId(comment.id);
                                comment.fetchNestedComments = nestedComments.length;
                                totalNestedComments += nestedComments.length;
                                return comment;
                            })
                        );
                        totalComments = fetchTotalPostComments + totalNestedComments;
                    }
                    let totalViewsOnPost = await fetchTotalViewsOnPost(postId)
                    let isLike = await fetchUsersLikeToPostDataByUsersId(id, postId)
                    // let userData = await fetchUsersById(item.userId)
                    let fetchAllLikePosts = await fetchLikeOnParticularPost(postId)
                    item.totalLikes = fetchAllLikePosts.length > 0 ? fetchAllLikePosts.length : 0
                    item.isLike = isLike.length > 0 ? true : false
                    item.totalComments = totalComments;
                    item.totalViews = totalViewsOnPost.length > 0 ? totalViewsOnPost.length : 0;
                    item.totalShare = 0;
                    item.userId = item.userId;
                    item.tagPeople = tagPeople;
                    return item;
                    // }
                    // return null;
                })
            );
            fetchThereOwnPost = fetchThereOwnPost;
            // fetchOthersPost = fetchOthersPost.filter(Boolean);
            // return handleSuccess(res, 200, fetchOthersPost.length > 0 ? Msg.postFoundSuccessfull : Msg.postNotFound, fetchOthersPost);
            return handleSuccess(res, 200, Msg.postFoundSuccessfull, fetchThereOwnPost);
        } else {
            return handleError(res, 400, Msg.postNotFound, []);
        }
    } catch (error) {
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const retriveOtherUsersPost = async (req, res) => {
    try {
        let { id } = req.user
        let fetchOthersPost = await fetchOtherPostModel()
        if (fetchOthersPost.length > 0) {
            let isFollower = false;
            let fetchFollowingId = await retrieveMyFollowing(id);
            const followingIds = fetchFollowingId.map(i => i.followingId);
            fetchOthersPost = await Promise.all(
                fetchOthersPost.map(async (item) => {
                    let isExist;
                    if (item.audiance === 'Followers') {
                        fetchOtherUsersFollowers = await retrieveMyFollowers(item.id)
                        isExist = fetchOtherUsersFollowers.includes(id)
                        isExist = true
                    } else {
                        isExist = true
                    }

                    // if (item.audiance === mediaTypes.EVERYONE || item.audiance === 'Followers' || followingIds.includes(item.userId)) {
                    // if ((item.audiance === mediaTypes.EVERYONE || item.audiance === 'Followers') && followingIds.includes(item.userId)) {
                    if ([mediaTypes.EVERYONE, 'Followers'].includes(item.audiance) && followingIds.includes(item.userId)) {

                        if (item.audiance === mediaTypes.EVERYONE) {
                            let listOfFollowers = await isUsersFollowToAnotherUsers(id, item.userId);
                            isFollower = Array.isArray(listOfFollowers) && listOfFollowers.length > 0;
                        } else {
                            isFollower = true;
                        }
                        if (item.audiance === mediaTypes.EVERYONE && item.userId === id) {
                            isFollower = true;
                        }
                        let isSelfPost = false;
                        if (item.userId == id) {
                            isSelfPost = true
                        }

                        item.isFollower = isFollower;
                        item.isSelfPost = isSelfPost;
                        let tagPeople = [];
                        let tagsPeople = item.tagPeople ? (typeof item.tagPeople === "string" ? JSON.parse(item.tagPeople) : item.tagPeople) : []; // Ensure it's an array

                        if (Array.isArray(tagsPeople) && tagsPeople.length > 0) {
                            tagPeople = await Promise.all(
                                tagsPeople.map(async (i) => ({
                                    userId: i,
                                    userDetails: await fetchUsersById(i)
                                }))
                            );
                        }
                        let postId = item.id
                        let totalComments = 0;
                        let fetchCommentsByPostId = await fetchCommentAccordingToPostId(postId);
                        if (fetchCommentsByPostId.length > 0) {
                            let fetchTotalPostComments = fetchCommentsByPostId.length;
                            let totalNestedComments = 0;
                            fetchCommentsByPostId = await Promise.all(
                                fetchCommentsByPostId.map(async (comment) => {
                                    let nestedComments = await fetchCommentAccordingToParentCommentId(comment.id);
                                    comment.fetchNestedComments = nestedComments.length;
                                    totalNestedComments += nestedComments.length;
                                    return comment;
                                })
                            );
                            totalComments = fetchTotalPostComments + totalNestedComments;
                        }
                        let totalViewsOnPost = await fetchTotalViewsOnPost(postId)
                        let isLike = await fetchUsersLikeToPostDataByUsersId(id, postId)
                        let userData = await fetchUsersById(item.userId)
                        let fetchAllLikePosts = await fetchLikeOnParticularPost(postId)
                        item.totalLikes = fetchAllLikePosts.length > 0 ? fetchAllLikePosts.length : 0
                        item.isLike = isLike.length > 0 ? true : false
                        item.totalComments = totalComments;
                        item.totalViews = totalViewsOnPost.length > 0 ? totalViewsOnPost.length : 0;
                        item.totalShare = 0;
                        item.userId = item.userId;
                        item.fullName = userData[0].fullName;
                        item.profile = userData[0].profileImage ? userData[0].profileImage : null
                        item.tagPeople = tagPeople;
                        return item;
                    }
                    return null;
                })
            );
            fetchOthersPost = fetchOthersPost.filter(Boolean);
        }
        return handleSuccess(res, 200, fetchOthersPost.length > 0 ? Msg.postFoundSuccessfull : Msg.postNotFound, fetchOthersPost);
    } catch (error) {
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const likePost = async (req, res) => {
    try {
        let { postId } = req.query
        let { id, fullName } = req.user
        let fetchUsersLikeEntryData = await fetchUsersLikeToPostDataByUsersId(id, postId);
        if (fetchUsersLikeEntryData.length > 0) {
            await UsersUnLikeToPost(fetchUsersLikeEntryData[0].id);
            return handleSuccess(res, 200, Msg.unLikePost);
        }
        let data = {
            userId: id,
            postId
        }
        let userLikeEntry = await addUserLikeToPost(data);
        if (userLikeEntry.insertId == 0) {
            return handleError(res, 400, Msg.insertError);
        }

        let fetchPostUserId = await fetchUsersByPostId(data.postId)
        if (fetchPostUserId[0].userId !== id) {
            let userData = await fetchUsersById(fetchPostUserId[0].userId);
            let usersfetchFcmToken = userData[0].fcmToken
            let userId = userData[0].id
            let followId = null
            let notificationType = NotificationTypes.LIKES_NOTIFICATION
            let notificationSend = 'likedPost'
            let message = await createNotificationMessage({ notificationSend, fullName, id, userId, followId, usersfetchFcmToken, notificationType, postId });
            // let message = await createNotificationMessage({ notificationSend, fullName, id, userId, followId, fetchFcmToken: { fcmToken: usersfetchFcmToken }, notificationType });
            await sendNotification(message);
        }
        return handleSuccess(res, 200, Msg.likePost);
    } catch (error) {
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const userViewsPost = async (req, res) => {
    try {
        let { postId } = req.body
        let { id } = req.user
        let data = {
            userId: id,
            postId
        }
        let isExist = await isAllreadyUserViewThePost(id, postId)
        if (isExist.length > 0) {
            return handleSuccess(res, 200, Msg.dataAddedSuccessfull);
        } else {
            let userLikeEntry = await userViewOtherPost(data);
            if (userLikeEntry.insertId == 0) {
                return handleError(res, 400, Msg.insertError);
            }
        }
        return handleSuccess(res, 200, Msg.dataAddedSuccessfull);
    } catch (error) {
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const createPostByUsers = async (req, res) => {
    try {
        let { id } = req.user
        let { captions, hasTags, location, audiance, mediaType, tagPeople } = req.body
        let tagsPeople = tagPeople ? JSON.parse(tagPeople) : null
        let hasTag = hasTags ? JSON.parse(hasTags) : null
        let media;
        let videoUrl = null;
        let imageUrl = null;
        // if (req.file) {
        //     media = req.file && req.file.filename;
        // }
        if (req.file) {
            media = req.file ? getPublicUrl(req.file.key) : null;
        }

        if (mediaType == mediaTypes.VIDEO) {
            videoUrl = media
        } else {
            imageUrl = media
        }
        let data = {
            userId: id,
            videoUrl,
            imageUrl,
            captions,
            hasTags: JSON.stringify(hasTag),
            location,
            tagPeople: JSON.stringify(tagsPeople),
            audiance,
            mediaType,
        }
        let userLikeEntry = await createNewPosts(data);
        if (userLikeEntry.insertId == 0) {
            return handleError(res, 400, Msg.insertError);
        }
        return handleSuccess(res, 200, Msg.postCreate);
    } catch (error) {
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const fetchUsersNotifications = async (req, res) => {
    try {
        let { id } = req.user
        let notificationList = await fetchUsersNotificationByUsersId(id)
        if (notificationList.length > 0) {
            notificationList = await Promise.all(
                notificationList.map(async (item) => {
                    item.profileImage = item.profileImage != null ? + item.profileImage : null
                    return item
                })
            )
            return handleSuccess(res, 200, Msg.notificationFetchSuccessfully, notificationList);
        } else {
            return handleError(res, 400, Msg.notificationFailedToFetch, []);
        }
    } catch (error) {
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const fetchAllUsers = async (req, res) => {
    try {
        let { id } = req.user
        let getAllUsers = await fetchAllUsersModel(id)
        if (getAllUsers.length > 0) {
            getAllUsers = await Promise.all(
                getAllUsers.map(async (item) => {
                    let isBlockedUsers = await fetchBlockedByUsersIdAndCurrentUserLogin(id, item.id);
                    let isFollower = await isUsersFollowToAnotherUsers(id, item.id)
                    let fetchMyFolowers = await retrieveMyFollowers(item.id)
                    item.profileImage = item.profileImage != null ? item.profileImage : null
                    item.fetchMyFolowers = fetchMyFolowers.length > 0 ? fetchMyFolowers.length : 0
                    item.isFollower = isFollower.length > 0 ? true : false
                    item.isBlocked = isBlockedUsers.length > 0 ? true : false
                    return item
                })
            )
            return handleSuccess(res, 200, Msg.dataFoundSuccessful, getAllUsers);
        } else {
            return handleError(res, 400, Msg.dataNotFound, []);
        }
    } catch (error) {
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const accountDelete = async (req, res) => {
    try {
        let { id } = req.user
        let accountDeletedByUserId = await accountDeleteModel(id);
        if (accountDeletedByUserId.affectedRows == 0) {
            return handleError(res, 400, Msg.accountNotDelete);
        }
        return handleSuccess(res, 200, Msg.accountDeleteSuccessfull);
    } catch (error) {
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const commentOnPost = async (req, res) => {
    try {
        let { id, fullName } = req.user
        let { postId, comments, parentCommentId } = req.body
        let postIds = null;
        let parentCommentIds = null
        if (postId) {
            postIds = postId
        } else {
            parentCommentIds = parentCommentId
        }
        let data = {
            userId: id,
            postId: postIds,
            parentCommentId: parentCommentIds,
            comments
        }
        let userLikeEntry = await addCommentsOnParticularPost(data);
        if (userLikeEntry.insertId == 0) {
            return handleError(res, 400, Msg.insertError);
        }
        let fetchPostUserId = await fetchUsersByPostId(data.postId)
        if (fetchPostUserId[0].userId !== id) {
            let userData = await fetchUsersById(fetchPostUserId[0].userId);
            let usersfetchFcmToken = userData[0]?.fcmToken || ""
            let userId = userData[0].id
            let followId = null
            let notificationType = NotificationTypes.COMMENTS_NOTIFICATION
            let notificationSend = 'commentsOnPost';
            let message = await createNotificationMessage({ notificationSend, fullName, id, userId, followId, usersfetchFcmToken, notificationType, postId });
            await sendNotification(message, postId);
        }
        return handleSuccess(res, 200, Msg.commentsPostedSuccessfull);
    } catch (error) {
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const fetchCommentAndNestedCommentsOnPost = async (req, res) => {
    try {
        let { id } = req.user
        let { postId, parentCommentId } = req.query
        let details;
        if (postId) {
            details = await fetchCommentAccordingToPostId(postId)
        } else {
            details = await fetchCommentAccordingToParentCommentId(parentCommentId)
        }
        if (details.length == 0) {
            return handleError(res, 200, Msg.dataNotFound, []);
        }
        details = await Promise.all(
            details.map(async (item) => {
                let fetchNestedComments;
                if (postId) {
                    fetchNestedComments = await fetchCommentAccordingToParentCommentId(item.id)
                } else {
                    fetchNestedComments = []
                }
                let userData = await fetchUsersById(item.userId)
                item.profileImage = userData[0].profileImage != null ? userData[0].profileImage : null
                item.fullName = userData[0].fullName
                item.userName = userData[0].userName
                item.itsHaveChildReplies = fetchNestedComments.length > 0 ? true : false
                return item
            })
        )
        return handleSuccess(res, 200, Msg.dataFoundSuccessful, details);
    } catch (error) {
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const likeOnPostComments = async (req, res) => {
    try {
        let { id } = req.user
        let { commentId } = req.body
        let ifAllreadyLikeOnComments = await fetchLikeOnPostCommentedByUsersId(commentId, id)
        if (ifAllreadyLikeOnComments.length > 0) {
            await UsersUnLikeToCommentedPost(ifAllreadyLikeOnComments[0].id);
            return handleSuccess(res, 200, Msg.removeLikeCommentsOnPost);
        }
        let data = {
            commentId: commentId,
            userId: id,
        }
        let userLikeEntry = await addLikesOnParticularCommentPost(data);
        if (userLikeEntry.insertId == 0) {
            return handleError(res, 400, Msg.insertError);
        }
        return handleSuccess(res, 200, Msg.likeOnComments);
    } catch (error) {
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const notificationAndAnnoucmetOnOffByUserId = async (req, res) => {
    try {
        let { id } = req.user
        let { toggleType } = req.body
        let isUsersExists = await fetchUsersById(id)
        let status = variableTypes.OFF
        if (toggleType == variableTypes.NOTIFICATION) {
            let isNotificationOn;
            if (isUsersExists[0].pushNotifications == 1) {
                isNotificationOn = await pushNotificationOff(id)
                status = variableTypes.OFF
            } else {
                isNotificationOn = await pushNotificationOn(id)
                status = variableTypes.ON
            }
            return handleSuccess(res, 200, `${Msg.notification}${status}`);
        } else if (toggleType == variableTypes.GIVEAWAYANNOUCMENT) {
            let giveAwayAnnoucments;
            if (isUsersExists[0].giveAwayAnnoucment == 1) {
                status = variableTypes.OFF
                giveAwayAnnoucments = await giveAwayAnnoucmentOff(id)
            } else {
                status = variableTypes.ON
                giveAwayAnnoucments = await giveAwayAnnoucmentOn(id)
            }
            return handleSuccess(res, 200, `${Msg.giveawayAnnoucment}${status}`);
        } else {
            return handleError(res, 400, Msg.wrongToggleType);
        }
    } catch (error) {
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const fetchNotificationAndAnnoucmetOnOffByUserId = async (req, res) => {
    try {
        let { id } = req.user
        let userDeatils = await fetchUsersById(id)
        let data = {
            pushNotifications: userDeatils[0].pushNotifications,
            giveAwayAnnoucment: userDeatils[0].giveAwayAnnoucment
        }
        return handleSuccess(res, 200, Msg.dataFoundSuccessful, data);
    } catch (error) {
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const deletePostsComments = async (req, res) => {
    try {
        let { id } = req.user
        let { commentId } = req.body
        let isDeletePostsComments = await deletePostByCommentsId(commentId)
        if (isDeletePostsComments.affectedRows == 0) {
            return handleError(res, 400, Msg.failedToCommentsDelete);
        }
        return handleSuccess(res, 200, Msg.deleteCommentsSuccessfully);
    } catch (error) {
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const fetchPostByPostId = async (req, res) => {
    try {
        let { id } = req.user
        let { postId } = req.query
        let fetchPostDetailsByPostId = await fetchUsersByPostId(postId);
        if (!fetchPostDetailsByPostId || fetchPostDetailsByPostId.length === 0) {
            return handleError(res, 400, Msg.postNotFound);
        }
        if (fetchPostDetailsByPostId.length > 0) {
            let isFollower = false;
            let fetchFollowingId = await retrieveMyFollowing(id);
            const followingIds = fetchFollowingId.map(i => i.followingId);
            fetchPostDetailsByPostId = await Promise.all(
                fetchPostDetailsByPostId.map(async (item) => {
                    if (item.audiance === mediaTypes.EVERYONE || followingIds.includes(item.userId)) {
                        if (item.audiance === mediaTypes.EVERYONE) {
                            let listOfFollowers = await isUsersFollowToAnotherUsers(id, item.userId);
                            isFollower = Array.isArray(listOfFollowers) && listOfFollowers.length > 0;
                        } else {
                            isFollower = true;
                        }
                        let isSelfPost;
                        if (item.userId == id) {
                            isSelfPost = true
                        } else {
                            isSelfPost = false
                        }
                        item.isFollower = isFollower;
                        item.isSelfPost = isSelfPost;
                        let tagPeople = [];
                        let tagsPeople = item.tagPeople ? (typeof item.tagPeople === "string" ? JSON.parse(item.tagPeople) : item.tagPeople) : []; // Ensure it's an array

                        if (Array.isArray(tagsPeople) && tagsPeople.length > 0) {
                            tagPeople = await Promise.all(
                                tagsPeople.map(async (i) => ({
                                    userId: i,
                                    userDetails: await fetchUsersById(i)
                                }))
                            );
                        }
                        let postId = item.id
                        let totalComments = 0;
                        let fetchCommentsByPostId = await fetchCommentAccordingToPostId(postId);
                        if (fetchCommentsByPostId.length > 0) {
                            let fetchTotalPostComments = fetchCommentsByPostId.length;
                            let totalNestedComments = 0;
                            fetchCommentsByPostId = await Promise.all(
                                fetchCommentsByPostId.map(async (comment) => {
                                    let nestedComments = await fetchCommentAccordingToParentCommentId(comment.id);
                                    comment.fetchNestedComments = nestedComments.length;
                                    totalNestedComments += nestedComments.length;
                                    return comment;
                                })
                            );
                            totalComments = fetchTotalPostComments + totalNestedComments;
                        }
                        let totalViewsOnPost = await fetchTotalViewsOnPost(postId)
                        let isLike = await fetchUsersLikeToPostDataByUsersId(id, postId)
                        let userData = await fetchUsersById(item.userId)
                        let fetchAllLikePosts = await fetchLikeOnParticularPost(postId)
                        item.totalLikes = fetchAllLikePosts.length > 0 ? fetchAllLikePosts.length : 0
                        item.isLike = isLike.length > 0 ? true : false
                        item.totalComments = totalComments;
                        item.totalViews = totalViewsOnPost.length > 0 ? totalViewsOnPost.length : 0;
                        item.totalShare = 0;
                        item.userId = item.userId;
                        item.fullName = userData[0].fullName;
                        item.profile = userData[0].profileImage ? userData[0].profileImage : null
                        item.tagPeople = tagPeople;
                        return item;
                    }
                    return null;
                })
            );
            fetchPostDetailsByPostId = fetchPostDetailsByPostId.filter(Boolean);
        }
        return handleSuccess(res, 200, fetchPostDetailsByPostId.length > 0 ? Msg.postFoundSuccessfull : Msg.postNotFound, fetchPostDetailsByPostId);
    } catch (error) {
        return handleError(res, 500, Msg.internalServerError);
    }
};
