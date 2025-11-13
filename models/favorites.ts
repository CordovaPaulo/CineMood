import mongoose from 'mongoose';

interface PromptEntry {
    mood: string;
    movieIds: string[];
    createdAt?: Date;
}

interface Favorite {
    userId: string;
    prompts: PromptEntry[];
}

const promptSchema = new mongoose.Schema<PromptEntry>({
    mood: { type: String, required: true },
    movieIds: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now }
}, { _id: false });

const favoriteSchema = new mongoose.Schema<Favorite>({
    userId: { type: String, required: true },
    prompts: { type: [promptSchema], default: [] }
}, { timestamps: true });

const FavoriteModel = (mongoose.models.Favorite as mongoose.Model<Favorite>) || mongoose.model<Favorite>('Favorite', favoriteSchema);

export default FavoriteModel;
