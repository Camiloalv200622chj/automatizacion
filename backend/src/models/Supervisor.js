import mongoose from 'mongoose';

const supervisorSchema = new mongoose.Schema({
    nombreCompleto: {
        type: String,
        required: [true, 'El nombre completo del supervisor es obligatorio'],
        trim: true
    },
    correo: {
        type: String,
        required: [true, 'El correo electrónico es obligatorio'],
        unique: true,
        trim: true,
        lowercase: true
    }
}, {
    timestamps: true
});

const Supervisor = mongoose.model('Supervisor', supervisorSchema);

export default Supervisor;
