const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const employerSchema = new Schema({
    oldUid: String,
    employeeMemberId: { type: String, unique: true, required: true, sparse: true },
    memberType: { type: Number, enum: [1, 2] },                      //1 = Individual, 2 = Organization
    weavyId: { type: Number },
    fullName: { type: String, required: true },
    propertyType: { type: Number, enum: [1, 2, 3, 4, 5] },                    //1 = Hotel, 2 = Restaurant, 3 = Cafe, 4 = Cloud Kitchen, 5 = Other, 6 = Not Applicable
    addressLine1: { type: String },
    addressLine2: { type: String },
    cityCode: { type: Schema.Types.ObjectId, ref: 'City' },
    cityName: { type: String },
    pincode: { type: String },
    landmark: { type: String },
    occupation: { type: String },
    gender: { type: Number, enum: [1, 2, 3] },          //1 = Male, 2 = Female, 3 = Other
    provinceCode: { type: Schema.Types.ObjectId, ref: 'Provinces' },
    provinceName: { type: String },
    mobile: {
        type: Number, required: true
    },
    whatsappNumber: { type: Number },
    altMobile: { type: Number },
    email: { type: String, required: true, trim: true, lowercase: true },
    gmail: { type: String },
    gmailKey: { type: String },
    url: { type: String },
    tin: { type: String },
    yoe: { type: Number },
    fssai: { typ: String },
    mobileVerified: { type: Number, required: true, enum: [0, 1], default: 0 },    //1 = Yes, 0 = No
    emailVerified: { type: Number, required: true, enum: [0, 1], default: 0 },     //1 = Yes, 0 = No
    whatsappNumberVerified: { type: Number, required: true, enum: [0, 1], default: 0 },  //1 = Yes, 0 = No

    password: { type: String, required: true },
    dob: { type: Date },
    qualificationCode: { type: String },
    otherQualification: { type: String },
    languages: { type: [String], default: undefined },
    about: { type: String },
    contactPerson: { type: String },
    contactPersonMobile: { type: Number },
    userPlan: { type: Number, required: true, enum: [0, 1, 2, 3], default: 0 },   //0 = Free Plan, 1 = Plan A, 2 = Plan B, 3 = Plan C
    profilePercent: { type: Number, default: 10 },
    passwordUpdateDateTime: { type: Date, default: Date.now },
    lastLoginDateTime: { type: Date },
    smsContact: { type: Number, enum: [0, 1], default: 1 },                 //1 = Yes, 2 = No
    whatsappContact: { type: Number, enum: [0, 1], default: 1 },            //1 = Yes, 2 = No
    emailContact: { type: Number, enum: [0, 1], default: 1 },               //1 = Yes, 2 = No
    chatContact: { type: Number, enum: [0, 1], default: 1 },     //1 = Yes, 0 = No
    notificationStatus: { type: Number, enum: [0, 1], default: 1 },
    dp: { type: String },
    registerIP: { type: String, required: true },
    registerMAC: { type: String, required: true },
    loginIP: { type: String, required: true },
    loginMAC: { type: String, required: true },
    deviceToken: { type: String },
    status: { type: Number, required: true, enum: [0, 1, 2, 3, 4], default: 0 },//0=Not Verified, 1 = Active, 2 = Disabled, 3 = Suspended,4=Delete Requested
    webAccess: { type: Number, enum: [0, 1] },
    appAccess: { type: Number, enum: [0, 1] },
    establishmentYear: Number,
    employeesCount: Number,
    website: String,
    area: { type: String, trim: true },
    planStartDate: { type: Date },
    planEndDate: { type: Date },
    planNextAutoRenewalDate: { type: Date },
    roleUpdatedAt: { type: Date },
    basicProfileStatus: { type: Number, enum: [0, 1] },
    areaCoordinates: {
        type: {
            type: String, enum: ['Point']
        },
        coordinates: {
            type: [Number], default: undefined
        }
    },
    cityCoordinates: {
        type: {
            type: String, enum: ['Point']
        },
        coordinates: {
            type: [Number], default: undefined
        }
    },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
    deleteRequestedAt: Date
}, { toObject: { virtuals: true }, toJSON: { virtuals: true } });

employerSchema.index({ areaCoordinates: '2dsphere' });
employerSchema.index({ cityCoordinates: '2dsphere' });

module.exports = mongoose.model('employers', employerSchema);











































