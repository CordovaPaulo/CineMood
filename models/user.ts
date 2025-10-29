import mongoose from 'mongoose';

interface User {
    username: string;
    email: string;
    password: string;
}

const userSchema = new mongoose.Schema<User>({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

const UserModel = (mongoose.models.User as mongoose.Model<User>) || mongoose.model<User>('User', userSchema);

export default UserModel;