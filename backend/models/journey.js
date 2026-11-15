const mongoose = require('mongoose');

const journeySchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    university: { type: String, required: true },
    courseStudied: { type: String, required: true },
    company: { type: String, required: true },
    currentRole: { type: String, required: true },
    biggestChallenge: { type: String, required: true },
    skillsAcquired: { type: String, required: true },
    wishKnownSooner: { type: String, required: true },
    bestAdvice: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Journey', journeySchema);