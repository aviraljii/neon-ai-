import mongoose, { Schema, Document } from 'mongoose';

export interface IQuery extends Document {
  userId: mongoose.Types.ObjectId;
  queryText: string;
  result: {
    productName: string;
    brand?: string;
    category?: string;
    simpleExplanation?: string;
    price?: number;
    fabric?: string;
    comfortLevel?: string;
    bestFor?: string;
    suitableOccasions?: string[];
    budgetScore?: number;
    verdict?: string;
    priceRangeCategory?: 'budget' | 'mid-range' | 'premium';
    priceComparison?: {
      amazon?: number;
      flipkart?: number;
      myntra?: number;
      meesho?: number;
    };
    bestDeal?: {
      platform: string;
      price?: number;
      note?: string;
    };
    outfitRecommendation?: string[];
    buyingLinks?: {
      amazon?: string[];
      flipkart?: string[];
      myntra?: string[];
      meesho?: string[];
    };
  };
  createdAt: Date;
}

const querySchema = new Schema<IQuery>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    queryText: { type: String, required: true },
    result: {
      productName: { type: String },
      brand: { type: String },
      category: { type: String },
      simpleExplanation: { type: String },
      price: { type: Number },
      fabric: { type: String },
      comfortLevel: { type: String },
      bestFor: { type: String },
      suitableOccasions: [{ type: String }],
      budgetScore: { type: Number },
      verdict: { type: String },
      priceRangeCategory: {
        type: String,
        enum: ['budget', 'mid-range', 'premium'],
      },
      priceComparison: {
        amazon: { type: Number },
        flipkart: { type: Number },
        myntra: { type: Number },
        meesho: { type: Number },
      },
      bestDeal: {
        platform: { type: String },
        price: { type: Number },
        note: { type: String },
      },
      outfitRecommendation: [{ type: String }],
      buyingLinks: {
        amazon: [{ type: String }],
        flipkart: [{ type: String }],
        myntra: [{ type: String }],
        meesho: [{ type: String }],
      },
    },
  },
  { timestamps: true }
);

export const Query = mongoose.models.Query || mongoose.model<IQuery>('Query', querySchema);
