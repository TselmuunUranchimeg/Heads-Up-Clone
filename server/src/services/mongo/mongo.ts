import { connect, Model, Document, HydratedDocument, set } from "mongoose";

const connectToDb = async () => {
    try {
        set("strictQuery", false);
        await connect(process.env.DATABASE!, {
            dbName: "Heads_Up"
        });
        console.log("Connected to MongoDB database!!!");
    } catch (e) {
        throw e;
    }
};

function findDocument<T>(
    model: Model<T>,
    data: any
): Promise<(T & Document) | null> {
    return new Promise(async (resolve, reject) => {
        try {
            let document = await model.findOne(data).exec();
            resolve(document);
        } catch (e) {
            reject(e);
            throw e;
        }
    });
}

function createDocument<T>(
    model: Model<T>,
    item: T
): Promise<HydratedDocument<any> & T> {
    return new Promise(async (resolve, reject) => {
        try {
            let newDocument = await model.create(item);
            resolve(newDocument);
        } catch (e) {
            reject(e);
            throw e;
        }
    });
}

function updateDocument<T>(
    model: Model<T>,
    dataToFind: any,
    updatingBit: any
): Promise<(T & Document) | null> {
    return new Promise(async (resolve, reject) => {
        try {
            resolve(
                await model.findOneAndUpdate(dataToFind, updatingBit).exec()
            );
        } catch (e) {
            reject(e);
            throw e;
        }
    });
}

export { 
    findDocument, 
    createDocument, 
    updateDocument,
    connectToDb
};
