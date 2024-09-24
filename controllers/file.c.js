let appUtils = require('../utils/appUtils');
let AWS = require('aws-sdk');
require('aws-sdk/lib/maintenance_mode_message').suppress = true;
const { aws } = require('../config/config');

exports.upload = async (req, res, next) => {
    try {
        // upload file
        let body = Object.assign(req.body, req.query, req.params);
        req.folder = body.folder ? body.folder : 'cnc';
        let file = await appUtils.uploadFile(req, res);
        res.send(appUtils.responseJson(1, 1, file, 'Uploaded successfully!'))
    } catch (e) {
        res.send(appUtils.responseJson(0, 0, e.message, 'Exception : upload'))
    }
}

const s3bucket = new AWS.S3({
    accessKeyId: aws.accessKeyId,
    secretAccessKey: aws.secretAccessKey
});

// Function to list objects recursively
function listAllObjects(marker) {
    s3bucket.listObjects({ Bucket: bucketName, Marker: marker }, (err, data) => {
        if (err) {
            console.error('Error listing objects: ', err);
        } else {
            console.log('Objects in the bucket:');
            data.Contents.forEach((object) => {
                console.log(object.Key);
            });

            // If there are more objects, recursively call the function with the marker
            if (data.IsTruncated) {
                listAllObjects(data.Contents[data.Contents.length - 1].Key);
            }
        }
    });
}

exports.fetchAllFiles = async (req, res) => {
    try {
        // const params = {
        //     Bucket: 'cookandchef',
        // };
        // console.log("coming")

        // const response = await s3bucket.listObjectsV2(params).promise();
        // // https://cookandchef.s3.ap-south-1.amazonaws.com/cnc/old-data/cook_img/034.jpg
        // // List of objects (files) in the bucket
        // let objects = response.Contents;
        // console.log({ length: objects.length })
        // let files = [];
        // let i = 0;
        // objects.forEach((object) => {
        //     i++;
        //     files.push({ fileNumber: i, file: 'https://cookandchef.s3.ap-south-1.amazonaws.com/' + object.Key });
        // });

        // res.send(appUtils.responseJson(1, files, 'Files fetch successful', {}, files.length))

        const objects = [];

        function listAllObjects(marker) {
            s3bucket.listObjects({ Bucket: 'cookandchef', Marker: marker }, (err, data) => {
                if (err) {
                    console.error('Error listing objects: ', err);
                    return res.status(500).json({ error: 'Internal server error' });
                } else {
                    data.Contents.forEach((object) => {
                        objects.push('https://cookandchef.s3.ap-south-1.amazonaws.com/' + object.Key);
                    });

                    if (data.IsTruncated) {
                        listAllObjects(data.Contents[data.Contents.length - 1].Key);
                    } else {
                        console.log({ length: objects.length })
                        // Create a new Excel workbook
                        const workbook = new excel.Workbook();

                        // Add a worksheet to the workbook
                        const worksheet = workbook.addWorksheet('Sheet 1');

                        // Define a row counter
                        let row = 1;

                        // Iterate through the data array and add each element to a separate row
                        objects.forEach((element) => {
                            worksheet.cell(row, 1).string(element);
                            row++;
                        });

                        // Save the workbook to a file
                        workbook.write('output.xlsx');

                        console.log('Excel file created successfully');
                        return res.json({ objects });
                    }
                }
            });
        }

        listAllObjects();

    }
    catch (e) {
        res.send(appUtils.responseJson(0, e.message, 'Exception : upload'))
    }
}
