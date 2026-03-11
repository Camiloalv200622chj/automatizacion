import mongoose from 'mongoose';

const recordSchema = new mongoose.Schema({
    nombreContratista: {
        type: String,
        required: [true, 'El nombre del contratista es obligatorio'],
        trim: true
    },
    documento: {
        type: String,
        required: true,
        trim: true
    },
    entidad: {
        type: String,
        required: true
    },
    periodo: {
        type: String, // Formato "YYYY-MM"
        required: true
    },
    fechaProcesamiento: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['success', 'failed'],
        default: 'success'
    },
    errorMessage: {
        type: String,
        trim: true
    },
    driveFileId: {
        type: String
    },
    driveLink: {
        type: String
    }
}, {
    timestamps: true
});

// Índice único por contratista, entidad y periodo para evitar duplicados en el mismo mes
recordSchema.index({ documento: 1, entidad: 1, periodo: 1 }, { unique: true });

const Record = mongoose.model('Record', recordSchema);

export default Record;
