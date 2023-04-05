const MongoClient = require('mongodb').MongoClient;
const mongoURL = process.env.MONGO_URL;
const dbName = 'alpha_file_syastem';


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

module.exports = {
    findUserInDatabase,
}