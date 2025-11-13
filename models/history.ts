import mongoose from 'mongoose';

interface PromptEntry {
    mood: string;
    movieIds: string[];
    createdAt?: Date;
}

interface History {
    userId: string;
    prompts: PromptEntry[];
}

const promptSchema = new mongoose.Schema<PromptEntry>({
    mood: { type: String, required: true },
    movieIds: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now }
}, { _id: false });

const historySchema = new mongoose.Schema<History>({
    userId: { type: String, required: true },
    prompts: { type: [promptSchema], default: [] }
}, { timestamps: true });

const HistoryModel = (mongoose.models.History as mongoose.Model<History>) || mongoose.model<History>('History', historySchema);

export default HistoryModel;
