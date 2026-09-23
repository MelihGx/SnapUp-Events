const getAdminMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    admin: {
      user_id: req.user.user_id,
      user_name: req.user.user_name,
      user_mail: req.user.user_mail,
      user_role: req.user.user_role,
      is_email_verified: req.user.is_email_verified,
    },
  });
};

module.exports = {
  getAdminMe,
};
