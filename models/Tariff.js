const mongoose = require('mongoose');

const TariffSchema = new mongoose.Schema({
    vehicleName: { type: String, required: true },
    vehicleIcon: { type: String, default: 'fa-car' },
    
    // Package Rates
    pkg4hr40km: { type: Number },
    pkg8hr80km: { type: Number },
    pkg10hr100km: { type: Number },
    pkg12hr120km: { type: Number },

    // 12 Hrs Rent Details
    rent12hr: { type: Number },
    rent12hrExtraHour: { type: Number },
    rent12hrExtraKm: { type: Number },
    rent12hrDriverBata: { type: Number },
    rent12hrMileage: { type: Number }, // rendered with "Kms"

    // 24 Hrs Rent Details
    rent24hr: { type: Number },
    rent24hrExtraHour: { type: Number },
    rent24hrExtraKm: { type: Number },
    rent24hrDriverBata: { type: Number },
    rent24hrMileage: { type: Number },

    order: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Tariff', TariffSchema);
