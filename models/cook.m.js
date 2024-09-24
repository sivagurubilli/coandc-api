const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const moment = require('moment-timezone');

const cookSchema = new Schema({
    cookMemberId: { type: String, unique: true, maxlength: 15, sparse: true },
    oldUid: { type: String },
    weavyId: { type: Number },
    memberType: { type: Number, enum: [1, 2] },       //1 = Individual, 2 = Organization
    cookType: { type: Number, enum: [1, 2] },                       // 1 = House Cook, 2 = Chef
    partyCook: { type: Number, enum: [0, 1] },                     // 1 = Yes, 0 = No
    fullName: { type: String, required: true },
    addressLine1: { type: String },
    addressLine2: { type: String },
    cityCode: { type: Schema.Types.ObjectId, ref: "City" },
    cityName: { type: String },
    pincode: { type: String },
    landmark: { type: String },
    gender: { type: Number, enum: [1, 2, 3] },     //1 = Male, 2 = Female, 3 = Other
    provinceCode: { type: Schema.Types.ObjectId, ref: "Province" },
    provinceName: { type: String },
    mobile: {
        type: Number, required: true
    },
    whatsappNumber: { type: Number, unique: true, sparse: true },
    altMobile: { type: Number },
    email: { type: String, required: true, trim: true, lowercase: true },
    gmail: { type: String },
    gmailKey: { type: String },
    url: { type: String },
    tin: { type: String },
    fssai: { type: String },
    mobileVerified: { type: Number, required: true, enum: [0, 1], default: 0 },  //1 = Yes, 0= No
    emailVerified: { type: Number, required: true, enum: [0, 1], default: 0 },   //1 = Yes, 0 = No
    whatsappNumberVerified: { type: Number, required: true, enum: [0, 1], default: 0 }, //1 = Yes, 0 = No
    password: { type: String, required: true },
    dob: { type: Date },
    qualificationCode: { type: String },
    otherQualification: { type: String },
    qualification: { type: String },
    languages: { type: [String], default: undefined },
    about: { type: String },
    householdCuisines: { type: [String], default: undefined },
    chefCuisines: { type: [String], default: undefined },
    payment: { type: String, trim: true },
    skills: { type: [String], default: undefined },
    chefExperience: { type: Number },
    currentSalary: { type: Number },
    expectedSalary: { type: Number },
    monthlySalaryRangeFrom: { type: Number },
    monthlySalaryRangeTo: { type: Number },
    jobType: { type: Number },                 // 1 = Full Time, 2 = Part Time, 3 = Any
    householdVesselWash: { type: Number, enum: [0, 1] },    //1 = Yes, 0 = No
    currentCompany: { type: String },
    partyCuisines: { type: [String], default: undefined },
    partyExperience: { type: Number },
    speciality: { type: String },
    partyMaxPlates: { type: Number },
    partyCookAvailability: { type: Number, enum: [1, 2, 3] },   //1 = All Days, 2 = Week Days, 3 = Weekend, 4 = Custom
    partyCookFoodType: { type: Number, enum: [1, 2, 3] },       //1 = Pure Veg, 2 = Veg / Non Veg, 3 = Jain Food
    partyCookVesselWash: { type: Number, enum: [0, 1] },    //1 = Yes, 0 = No 
    cateringMinPlates: { type: Number },
    cateringCuisines: { type: [String], default: undefined },
    jobSeeking: { type: Number, enum: [0, 1] },              //1 = Yes, 0 = No
    currentCityCode: { type: String },
    currentCityName: { type: String },
    relocate: { type: Number, enum: [0, 1] },
    resumeBuilder: { type: Number, enum: [0, 1] },
    resumeBuilderStatus: { type: Number, enum: [0, 1] },
    profileBoostRank: { type: Number, enum: [0, 1] },
    resume: { type: String },              //1 = Yes, 0 = No
    userPlan: { type: Number, required: true, default: 0 },  //0 = No Plan Assigned, 1 and above - PLans
    lastActionDate: { type: Date },
    userCredits: { type: Number, required: true, default: 10 },
    profilePercent: { type: Number, default: 10 },     //default 10	
    passwordUpdateDateTime: { type: Date, required: true, default: Date.now },
    lastLoginDateTime: { type: Date },
    smsContact: { type: Number, enum: [0, 1], default: 1 },          //1 = Yes, 0 = No
    whatsappContact: { type: Number, enum: [0, 1], default: 1 },     //1 = Yes, 0 = No
    emailContact: { type: Number, enum: [0, 1], default: 1 },        //1 = Yes, 0 = No
    chatContact: { type: Number, enum: [0, 1], default: 1 },         //1 = Yes, 0 = No
    notificationStatus: { type: Number, enum: [0, 1], default: 1 },  //1 = Yes, 0 = No
    dp: { type: String },
    registerIP: { type: String, required: true },
    registerMAC: { type: String, required: true },
    loginIP: { type: String, required: true },
    loginMAC: { type: String, required: true },
    deviceToken: { type: String },
    cateringFoodType: { type: Number, enum: [1, 2, 3] },  //1 = Pure Veg, 2 = Veg / Non Veg, 3 = Jain Food
    status: { type: Number, required: true, enum: [0, 1, 2, 3, 4, 5], default: 0 },  //0=Not active,1 = Active, 2 = Disabled,3=Suspended,4=Delete Requested,
    webAccess: { type: Number, enum: [0, 1] },
    appAccess: { type: Number, enum: [0, 1] },
    area: { type: String, trim: true },
    roleUpdatedAt: { type: Date },
    partyCookProfileStatus: { type: Number, enum: [0, 1] },
    houseCookProfileStatus: { type: Number, enum: [0, 1] },
    cateringProfileStatus: { type: Number, enum: [0, 1] },
    chefProfileStatus: { type: Number, enum: [0, 1] },
    basicProfileStatus: { type: Number, enum: [0, 1] },
    website: { type: String, trim: true },
    teamSize: { type: Number },
    areaCoordinates: {
        type: { type: String, enum: ['Point'] },
        coordinates: { type: [Number], default: undefined }
    },
    cityCoordinates: {
        type: { type: String, enum: ['Point'] },
        coordinates: { type: [Number], default: undefined }
    },
    currentCityCoordinates: {
        type: { type: String, enum: ['Point'] },
        coordinates: { type: [Number], default: undefined }
    },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
    deleteRequestedAt: Date,
    scriptdate: String
}, { toObject: { virtuals: true }, toJSON: { virtuals: true } });

cookSchema.index({ cityCoordinates: '2dsphere' });
cookSchema.index({ areaCoordinates: '2dsphere' });
cookSchema.index({ currentCityCoordinates: '2dsphere' });


module.exports = mongoose.model('cooks', cookSchema);




