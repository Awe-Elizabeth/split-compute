const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema(
    {
        Amount: {
            type: Number,
            required: [true, 'Amount to be split is required']
        },
        Currency: {
            type: String,
            required: [true, 'Amount currency is required']
        },
        CustomerEmail: {
            type: String
        },
        Balance:{
            type: Number,
        },
        SplitInfo: [
            {
                SplitType: {
                    type: String,
                    required: true,
                    enum: [
                        "FLAT", "RATIO", "PERCENTAGE"
                    ]
                },
                SplitValue: {
                    type: Number,
                    required: true
                },
                SplitEntityId: {
                    type: String,
                    required: true
                }
            }
        ],
        SplitBreakdown: [
            {
                SplitEntityId: String,
                Amount: Number
            }
        ]
    }
)

module.exports = mongoose.model('Transaction', TransactionSchema);