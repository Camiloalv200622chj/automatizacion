import mongoose from 'mongoose';

const contratistaSchema = new mongoose.Schema({
    nombreCompleto: {
        type: String,
        required: [true, 'El nombre completo es obligatorio'],
        trim: true
    },
    numeroDocumento: {
        type: String,
        required: [true, 'El número de documento es obligatorio'],
        unique: true,
        trim: true
    },
    tipoDocumento: {
        type: String,
        required: [true, 'El tipo de documento es obligatorio'],
        enum: ['CC', 'TI', 'CE', 'PEP'],
        default: 'CC'
    },
    perEntityData: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Contratista = mongoose.model('Contratista', contratistaSchema);

export default Contratista;
