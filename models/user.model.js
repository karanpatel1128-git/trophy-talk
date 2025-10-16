import db from "../config/db.js";

/**=======================user model start =====================================*/
export const isUsersExistsOrNot = async (email) => {
    return db.query("SELECT * FROM tbl_users WHERE email = ?", [email]);
};

export const fetchUsersByActivationCode = async (activationCode) => {
    return db.query("SELECT * FROM tbl_users WHERE code = ?", [activationCode]);
};

export const updateUsersByOtp = async (id) => {
    return db.query(
        `Update tbl_users set isVerified = 1 where id = ?`,
        [id]
    );
};

export const userRegistration = async (data) => {
    return db.query("INSERT INTO tbl_users SET ?", [data]);
};

export const fetchForgotPasswordCodeByCode = async (activationCode) => {
    return db.query("SELECT * FROM tbl_users WHERE forgotPasswordOtp = ?", [activationCode]);
};

export const updateUserForgotPasswordOtp = async (code, email) => {
    const query = "UPDATE tbl_users SET forgotPasswordOtp = ? WHERE email = ?";
    return db.query(query, [code, email]);
};

export const updateUserOtp = async (code, email) => {
    const query = "UPDATE tbl_users SET code = ? WHERE email = ?";
    return db.query(query, [code, email]);
};

export const fetchUsersByToken = async (genToken) => {
    return db.query("SELECT * FROM tbl_users WHERE genToken = ?", [genToken]);
};

export const updateUserPassword = async (password, email) => {
    const query = "UPDATE tbl_users SET password = ? WHERE email = ?";
    return db.query(query, [password, email]);
};

export const fetchUsersById = async (id) => {
    return db.query("SELECT * FROM tbl_users WHERE id = ?", [id]);
};

export const changePassword = async (password, id) => {
    const query = "UPDATE tbl_users SET password = ? WHERE id = ?";
    return db.query(query, [password, id]);
};

export const updateUsersProfile = async (updatedFields, id) => {
    const keys = Object.keys(updatedFields);
    const values = Object.values(updatedFields);
    const setClause = keys.map((key) => `${key} = ?`).join(", ");
    values.push(id);
    const query = `UPDATE tbl_users SET ${setClause} WHERE id = ?`;
    return db.query(query, values);
};

export const create_blocked = async (data) => {
    return db.query("INSERT INTO tbl_blockedusers SET ?", [data]);
};

export const unblockedToUsers = async (id, userId) => {
    return db.query(` DELETE FROM tbl_blockedusers WHERE blocked_from=? AND blocked_to=?`, [id, userId]);
};

export const fetchBlockedListUsers = async (id) => {
    return db.query(`SELECT * FROM tbl_blockedusers WHERE blocked_from = ? ORDER BY createdAt DESC`, [id]);
};

export const fetchBlockedUsersDetailed = async (blockedToIds) => {
    return db.query(`SELECT * FROM tbl_users WHERE id IN (${blockedToIds.join(',')})`)
};

export const insertUserNotifications = async (message, status, postId, responseText) => {
    try {
        const result = await db.query(
            `INSERT INTO tbl_notification (sendFrom, sendTo, followId, title, body, notificationType, status, postId) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                message.data.sendFrom,
                message.data.sendTo,
                message.data.followId || null, // Ensure empty strings are converted to NULL
                message.notification.title,
                message.notification.body,
                message.data.notificationType,
                status,
                postId
            ]
        );
        return result;
    } catch (error) {
        console.error("Database Insert Error:", error);
        return null;
    }
};

export const insertFollowersUsers = async (data) => {
    return db.query("INSERT INTO tbl_usersfollowers SET ?", [data]);
};

export const retrieveMyFollowing = async (id) => {
    return db.query("SELECT followingId FROM tbl_usersfollowers WHERE followersId = ? AND status=1 ", [id]);
};

export const retrieveMyFollowers = async (id) => {
    return db.query("SELECT followersId FROM tbl_usersfollowers WHERE followingId = ? AND status=1 ", [id]);
};

export const confirmRequest = async (followId) => {
    return db.query("UPDATE tbl_usersfollowers SET status = 1 WHERE id = ?", [followId]);
};

export const rejectRequest = async (followId) => {
    return db.query(` DELETE FROM tbl_usersfollowers WHERE id=?`, [followId]);
};

export const unFollow = async (id, userId) => {
    return db.query(` DELETE FROM tbl_usersfollowers WHERE followersId=? And followingId=?`, [id, userId]);
};

export const fetchThereOwnPostModel = async (id) => {
    return db.query("SELECT * FROM tbl_mypost WHERE userId = ? ORDER BY createdAt DESC", [id]);
};

export const fetchOtherPostModel = async () => {
    return db.query("SELECT * FROM tbl_mypost ORDER BY createdAt DESC");
};

export const addUserLikeToPost = async (data) => {
    return db.query("INSERT INTO tbl_userslike SET ?", [data]);
};

export const fetchUsersLikeToPostDataByUsersId = async (id, postId) => {
    return db.query("SELECT * FROM tbl_userslike WHERE userId  = ? And postId =?", [id, postId]);
};

export const UsersUnLikeToPost = async (id) => {
    return db.query(` DELETE FROM tbl_userslike WHERE id=?`, [id]);
};

export const fetchLikeOnParticularPost = async (id) => {
    return db.query("SELECT * FROM tbl_userslike WHERE postId = ?", [id]);
};

export const userViewOtherPost = async (data) => {
    return db.query("INSERT INTO tbl_userviewspost SET ?", [data]);
};

export const fetchTotalViewsOnPost = async (id) => {
    return db.query("SELECT * FROM tbl_userviewspost WHERE postId = ?", [id]);
};

export const isAllreadyUserViewThePost = async (id, postId) => {
    return db.query("SELECT * FROM tbl_userviewspost WHERE userId=? AND postId = ?", [id, postId]);
};

export const isUsersFollowToAnotherUsers = async (id, userId) => {
    return db.query("SELECT * FROM tbl_usersfollowers WHERE followersId=? And followingId=? ", [id, userId]);
};

export const createNewPosts = async (data) => {
    return db.query("INSERT INTO tbl_mypost SET ?", [data]);
};

export const fetchUsersNotificationByUsersId = async (id) => {
    return db.query("SELECT * FROM tbl_notification WHERE sendTo = ? ORDER BY createdAt DESC", [id]);
};

export const fetchAllUsersModel = async (id) => {
    return db.query("SELECT * FROM tbl_users WHERE id != ?", [id]);
};

export const fetchBlockedByUsersIdAndCurrentUserLogin = async (id, userId) => {
    return db.query(`SELECT * FROM tbl_blockedusers WHERE blocked_from = ? And blocked_to = ? `, [id, userId]);
};

export const accountDeleteModel = async (id) => {
    return db.query(` DELETE FROM tbl_users WHERE id=?`, [id]);
};

export const addCommentsOnParticularPost = async (data) => {
    return db.query("INSERT INTO tbl_userscomment SET ?", [data]);
};

export const fetchCommentAccordingToPostId = async (id) => {
    return db.query("SELECT * FROM tbl_userscomment WHERE postId = ? ORDER BY createdAt DESC", [id]);
};

export const fetchCommentAccordingToParentCommentId = async (id) => {
    return db.query("SELECT * FROM tbl_userscomment WHERE parentCommentId = ? ORDER BY createdAt DESC", [id]);
};

export const addLikesOnParticularCommentPost = async (data) => {
    return db.query("INSERT INTO tbl_commentlikes SET ?", [data]);
};

export const fetchLikeOnPostCommentedByUsersId = async (id, postId) => {
    return db.query("SELECT * FROM tbl_commentlikes WHERE commentId  = ? And userId =?", [id, postId]);
};

export const UsersUnLikeToCommentedPost = async (id) => {
    return db.query(` DELETE FROM tbl_commentlikes WHERE id=?`, [id]);
};

export const pushNotificationOn = async (id) => {
    const query = "UPDATE tbl_users SET pushNotifications = 1 WHERE id = ?";
    return db.query(query, [id]);
};

export const pushNotificationOff = async (id) => {
    const query = "UPDATE tbl_users SET  pushNotifications = 0 WHERE id = ?";
    return db.query(query, [id]);
};

export const giveAwayAnnoucmentOn = async (id) => {
    const query = "UPDATE tbl_users SET giveAwayAnnoucment = 1 WHERE id = ?";
    return db.query(query, [id]);
};

export const giveAwayAnnoucmentOff = async (id) => {
    const query = "UPDATE tbl_users SET  giveAwayAnnoucment = 0 WHERE id = ?";
    return db.query(query, [id]);
};

export const deletePostByCommentsId = async (id) => {
    return db.query(` DELETE FROM tbl_userscomment WHERE id=?`, [id]);
};

export const fetchUsersByPostId = async (id) => {
    return db.query("SELECT * FROM tbl_mypost WHERE id = ? ORDER BY createdAt DESC", [id]);
};

/**========================model end========================= */
