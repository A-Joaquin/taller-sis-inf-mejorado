import mongoose from 'mongoose';

const connectToMongoDB = async () => {
    try {
        mongoose.connect('mongodb://127.0.0.1:27017/sistema_adm_polleriaDB');
        console.log(">>> DB is connected");
    } catch (error) {
        console.log(error);
    }
}

export default connectToMongoDB;
