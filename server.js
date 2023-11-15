const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const connectDB = require('./config/db');
const https = require('https');
const asyncHandler = require('./async');
const errorHandler = require('./error');
const Transaction = require('./transaction.model');
const ErrorResponse = require('./errorResponse');

// Load env vars
dotenv.config({path: './config/.env'});

// connectDB();


const app = express();

//  Body Parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: false }));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//  Dev logging middleware
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
};

// Enable CORS
app.use(cors());



app.post('/split-payments/compute', asyncHandler    ( async (req, res, next) => {
    const {ID, Amount, Currency, CustomerEmail, SplitInfo} = req.body
    let balance = Amount
    let SplitBreakdown = []
    // const list = ["FLAT", "PERCENTAGE", "RATIO"]
    
//    const transaction =  await Transaction.create({
//         Amount,
//         Currency,
//         CustomerEmail,
//         SplitInfo   
//     });

    const flat = SplitInfo.filter(val => val.SplitType === "FLAT");
    const percent = SplitInfo.filter(val => val.SplitType === "PERCENTAGE");
    const ratio = SplitInfo.filter(val => val.SplitType === "RATIO");


    if(flat.length > 0){
        for(let i = 0; i < flat.length; i++){
            if( balance > flat[i].SplitValue){
                balance -= flat[i].SplitValue
                SplitBreakdown.push({
                    SplitEntityId: SplitInfo[i].SplitEntityId,
                    Amount: flat[i].SplitValue
                })
            }else{
                return next(new ErrorResponse("You have insufficient balance"))
            }
        }
    }
    
    
    if (percent.length > 0){
            for(let i = 0; i< percent.length; i++){
                let amount = (percent[i].SplitValue/100 * balance)
                balance -= amount;
                SplitBreakdown.push({
                    SplitEntityId: percent[i].SplitEntityId,
                    Amount: amount
                });
            }
            
        }
        
        if (ratio.length > 0){
            let amount;
            let total = 0;
            ratio.forEach(element => {
                total += element.SplitValue;
            });
            let leftAmount =  balance
           for(let i = 0; i < ratio.length; i++){  
                amount = (ratio[i].SplitValue/total * leftAmount)
                balance -= amount;
                SplitBreakdown.push({
                    SplitEntityId: ratio[i].SplitEntityId,
                    Amount: amount
                });
           }
    }


    res.status(200).json({
        ID,
        Balance: balance,
        SplitBreakdown: SplitBreakdown
    });
 
}));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, console.log(`Server running on ${process.env.PORT}`));

//  Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`.red);
    //  Close server &exit process
    server.close(() => process.exit(1)); 
});