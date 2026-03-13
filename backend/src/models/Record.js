import mongoose from 'mongoose';

const recordSchema = new mongoose.Schema({
    nombreContratista: {
        type: String,
        required: true
    },
    documento: {
        type: String,
        required: true
    },
    entidad: {
        type: String,
        required: true
    },
    periodo: {
        type: String,
        required: true
    },
    rutaArchivo: {
        type: String
    },
    status: {
        type: String,
        enum: ['success', 'failed'],
        default: 'success'
    },
    fechaProcesamiento: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Índice único por contratista, entidad y periodo para evitar duplicados en el mismo mes
recordSchema.index({ documento: 1, entidad: 1, periodo: 1 }, { unique: true });

const Record = mongoose.model('Record', recordSchema);

export default Record;
