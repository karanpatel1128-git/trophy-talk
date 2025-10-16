import express from 'express';
import controller from '../controllers/index.js';
import {
  userSignUp, userSignIn, emailVallidation, passwordVallidate, passwordChange,
  socialLoginValidation, tellAboutUsVallidations, scheduledDateAndTimeVallidations,
  createPostValidation,
  handleValidationErrors
} from '../vallidation/userVallidation.js';
import { authenticateUser } from '../middleware/userAuth.js';
import { upload } from '../middleware/upload.js'

const fieldsConfig = [
  { name: 'profileImage', maxCount: 1 },
  { name: 'backgroundImage', maxCount: 20 },
];

const app = express();

app.post('/signUp', userSignUp, handleValidationErrors, controller.userController.userSignUp);
app.post('/resendOtp', emailVallidation, handleValidationErrors, controller.userController.resendOtp);
app.post('/otpVerified', emailVallidation, handleValidationErrors, controller.userController.otpVerified);
app.post('/signIn', userSignIn, handleValidationErrors, controller.userController.userSignIn);
app.post('/forgotPassword', emailVallidation, handleValidationErrors, controller.userController.forgotPassword);
app.post('/changeForgotPassword', passwordVallidate, handleValidationErrors, controller.userController.changeForgotPassword);
app.post('/resetPassword', authenticateUser, passwordChange, handleValidationErrors, controller.userController.resetPassword);
app.get('/getUserProfile', authenticateUser, controller.userController.getUserProfile);
app.post("/editProfile", authenticateUser,upload.fields(fieldsConfig), controller.userController.editProfile);
app.post('/blockedToAnotherUsers', authenticateUser, controller.userController.blockedToAnotherUsers);
app.post('/unblockedToAnotherUsers', authenticateUser, controller.userController.unblockedToAnotherUsers);
app.post('/socialLogin', socialLoginValidation, handleValidationErrors, controller.userController.socialLogin);
app.get('/fetchBlockedList', authenticateUser, controller.userController.fetchBlockedList);

app.post('/follow', authenticateUser, controller.userController.follow);
app.get('/retrieveUserFollowersAndFollowing', authenticateUser, controller.userController.retrieveUserFollowersAndFollowing);
app.post('/unfollow', authenticateUser, controller.userController.unfollow);
app.get('/fetchMyPostByUserId', authenticateUser, controller.userController.fetchMyPostByUserId);
app.get('/retriveOtherUsersPost', authenticateUser, controller.userController.retriveOtherUsersPost);
app.post('/likePost', authenticateUser, controller.userController.likePost);
app.post('/userViewsPost', authenticateUser, controller.userController.userViewsPost);

app.post('/createPostByUsers', authenticateUser, upload.single('media'), createPostValidation, handleValidationErrors, controller.userController.createPostByUsers);
app.get('/fetchUsersNotifications', authenticateUser, controller.userController.fetchUsersNotifications);
app.get('/fetchAllUsers', authenticateUser, controller.userController.fetchAllUsers);
app.delete('/accountDelete', authenticateUser, controller.userController.accountDelete);
app.post('/commentOnPost', authenticateUser, controller.userController.commentOnPost);
app.get('/fetchCommentAndNestedCommentsOnPost', authenticateUser, controller.userController.fetchCommentAndNestedCommentsOnPost);
app.post('/likeOnPostComments', authenticateUser, controller.userController.likeOnPostComments);
app.post('/notificationAndAnnoucmetOnOffByUserId', authenticateUser, controller.userController.notificationAndAnnoucmetOnOffByUserId);
app.get('/fetchNotificationAndAnnoucmetOnOffByUserId', authenticateUser, controller.userController.fetchNotificationAndAnnoucmetOnOffByUserId);

app.delete('/commentsPostDelete', authenticateUser, controller.userController.deletePostsComments);
app.get('/fetchPostByPostId', authenticateUser, controller.userController.fetchPostByPostId);

export default app;
