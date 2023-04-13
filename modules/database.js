const AWS = require('aws-sdk');
const fs = require('fs');
require('dotenv').config();
// Load AWS configuration file


const accessKey = process.env.AWS_ACCESS_KEY;
const secretKey = process.env.AWS_SECRET_KEY;
const region = process.env.AWS_REGION;
const bucketName = 'alpha-limit';
// configure S3
const s3 = new AWS.S3(
    {accessKeyId: accessKey, secretAccessKey: secretKey, region: region}
);

async function uploadFolderToBucket(parentPath, filePaths , folderName) {
    console.log('parentPath',parentPath,filePaths[0]);
    let arr = [];
    filePaths.forEach(path => {
        let newPath = path.split('\\');
        newPath = newPath.slice(newPath.indexOf(folderName));
        arr.push({
            Bucket: bucketName,
            Key: `${parentPath}${newPath.join('/')}`,
            Body: fs.readFileSync(path),
        })
    })
    if(arr.length > 0){
        try {
            let result = arr.map(async (file) => {
              return await s3.upload(file).promise();
            });
            const data = await Promise.all(result);
            console.log(data);
            data.forEach((file) => {
                console.log(`File uploaded successfully. ${file.Location}`);
            });
            return true;
          } catch (err) {
            console.error(`Error uploading files. ${err}`);
            return false;
          }
    }
}


module.exports = {uploadFolderToBucket};
