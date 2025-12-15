const UserSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },

  email: {
    type: String,
    unique: true,
    required: true
  },

  password: {
    type: String,
    required: true,
    select: false
  },

  role: {
    type: String,
    enum: ['patient', 'practitioner', 'admin'],
    required: true
  },

  patientProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    default: null
  },

  practitionerProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Practitioner',
    default: null
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});