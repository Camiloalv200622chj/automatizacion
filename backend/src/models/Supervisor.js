import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

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
    },
    password: {
        type: String,
        required: [true, 'La contraseña es obligatoria'],
        minlength: 6
    }
}, {
    timestamps: true
});

// Encriptar contraseña antes de guardar
supervisorSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Método para verificar la contraseña
supervisorSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const Supervisor = mongoose.model('Supervisor', supervisorSchema);

export default Supervisor;
