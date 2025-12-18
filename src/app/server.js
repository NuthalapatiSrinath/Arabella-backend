import express from 'express';
import cors from 'cors';
import {connectDB} from './../database/index.js';
import {config} from './../config/index.js';
import routes from './routes.js';

const app=express();
app.use(cors({origin:'*',credentials:true}));
app.use(express.json());
app.use('/api',routes);
async function start(){
    try{
        await connectDB();
        const port=config?.app?.port ?? 3000;
        app.listen(port,() =>{
            console.log(`Service on port ${port}`);
        });
    }
    catch(err){
        console.log(`failed to start:`,err);
        process.exit(1);
    }
}
start();
export default app;

