const MongoClient = require('mongodb').MongoClient;
const mongoURL = process.env.MONGO_URL;
const dbName = 'alpha_file_syastem';
const {getTreeStructure} = require('./functions');
const {insertNewFolder} = require('./functions');
require('dotenv').config();
const mongoose = require('mongoose');

const mainId = process.env.MAIN_ID;

// create a mongoose model
const Folder = mongoose.model('Folder');

async function findUserInDatabase(data) {
    const {email, password} = data;
    const client = await MongoClient.connect(mongoURL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
    const db = client
        .db(dbName)
        .collection('users');

    try {
        const doc = await db.findOne({email: email});
        if (doc) {
            if (password === doc.password) {
                return doc
            } else {
                return 'incorrect password';
            }
        } else {
            return 'user not found'
        }
    } catch (error) {
        console.log(err)
    }
}

async function createFolderRecord(pathToFolder, folderPath, filePaths) {
    console.log('folder path', folderPath);
    const client = await MongoClient.connect(mongoURL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    const db = client
        .db(dbName)
        .collection('records');

    // get the folder name
    const folderName = folderPath
        .split('\\')
        .slice(-1)[0];

    let fileNames = filePaths.map(path => path.split('\\'));

    fileNames = fileNames.map(path => path.slice(path.indexOf(folderName)));

    let record = getTreeStructure(pathToFolder, fileNames);

    try {
        const doc = await db.findOne({name: 'main'});
        if (pathToFolder === 'main/') {
            if (doc.children.find((child) => child.name === folderName)) {
                console.log('folder already exists');
                return null;
            }
            const result = await db.updateOne({
                name: 'main'
            }, {
                $push: {
                    children: record
                }
            });
            console.log('result', result);
        } else {
            let oldFolder = JSON.stringify(doc);
            insertNewFolder(doc, record, pathToFolder);
            let newFolder = JSON.stringify(doc);
            if (oldFolder !== newFolder) {
                newFolder = new Folder(JSON.parse(newFolder));
                const result = await db.updateOne({
                    name: 'main'
                }, {
                    $set: {
                        children: newFolder.children
                    }
                });
                console.log('result', result);
            } else {
                console.log('error in updating the folder');
                return null;
            }

        }

    } catch (error) {
        console.log(error);
        return null;
    }

};

module.exports = {
    findUserInDatabase,
    createFolderRecord
}
