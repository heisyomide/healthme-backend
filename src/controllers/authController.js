exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { user, token } = await authService.loginUser(email, password);

  let redirectUrl = '/';

  if (user.role === 'patient') {
    redirectUrl = user.patientProfile
      ? '/dashboard/patient'
      : '/patient/onboarding';
  }

  if (user.role === 'practitioner') {
    redirectUrl = user.practitionerProfile
      ? '/dashboard/practitioner'
      : '/practitioner/onboarding';
  }

  res.status(200).json({
    success: true,
    message: 'Login successful',
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    },
    token,
    redirectUrl
  });

  exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .select('-password')
    .populate('patientProfile')
    .populate('practitionerProfile');

  if (!user) {
    throw new NotFoundError('User not found');
  }

  res.json({
    success: true,
    data: user
  });
});
});