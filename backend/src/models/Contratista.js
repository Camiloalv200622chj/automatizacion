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
    usuarioPortal: {
        type: String,
        required: [true, 'El usuario del portal es obligatorio'],
        trim: true
    },
    passwd: {
        type: String,
        required: [true, 'Las credenciales (contraseña) son obligatorias']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastAutomationStatus: {
        type: String,
        enum: ['success', 'failed', 'pending'],
        default: 'pending'
    },
    lastAutomationDate: {
        type: Date
    },
    lastAutomationLink: {
        type: String
    }
}, {
    timestamps: true
});

const Contratista = mongoose.model('Contratista', contratistaSchema);

export default Contratista;
