let {
  sendMail,
  sendOtp,
  sendNotice,
  responseJson,
  invoiceGen,
  localFileS3,
  scheduleCron,
  getNextTicketNumber,
  encryptData,
  decryptData,
  getfatSecretData
} = require('../utils/appUtils')
let {
  fatSecretMid
} = require('../middlewares')

let functions = {}
functions.testSendMail = async (params) => {
  let resp = await sendMail({
    to: 'svssteja@gmail.com',
    subject: 'test subject',
    type: 'communication',
    options: {
      name: 'Teja'
    }
  })
  return resp
}

functions.testSendOtp = async (params) => {
  console.log({ params })
  let resp = await sendOtp({
    mobileNo: 8897734943,
    message: "Dear Srija Wishing you a very Happy Birthday Team Life",
    templateId: "132830",
    senderId: "HEALON"
  })
  return resp
}

functions.testSendNotice = async (params) => {
  let resp = await sendNotice({
    title: 'Application received',
    body: 'Application received for MAIN CHEF',
    data: {
      link: `http://google.com`
    },
    userToken: ['fBaecZdFQpedSpUEuBdVf-:APA91bHS6jusfPup-QcTtT016sdKVf3_6PmDWd2i9I1Y5vkg04Gpd1fyXjglOLBTcfTto9FK5v3DzQNQ_xh3wZTzh9XA3JC3KDykzr79eIm6L1tKwNf_qDAGvtruRYPBlAtRgF-fSG9Z'],
    userId: '622b04f1e1d4c7398c170460'
  })
  return resp
}

functions.testInvoiceGen = async (params) => {
  try {
    let resp = await invoiceGen({
      name: "Puneet",
      address: {
        buildingName: "Building 4",
        street: "street 1",
        city: "city x",
        state: "Karnataka",
        zipCode: "544332"
      },
      invoiceNumber: 2111112,
      amount: "350",
      netAmount: "350",
      date: new Date().toDateString(),
      note: "Some Note"
    })
    return { resp };
  } catch (error) {
    console.log(error, 'ewrror')
    throw error
  }
}

functions.testLocalFileS3 = async (params) => {
  let resp = await localFileS3({
    "fileName": "invoice-1648648996317.pdf",
    "filePath": "C:\\Users\\PUNEET~1\\AppData\\Local\\Temp\\4fb10c34-e512-491e-bd1e-3d2ae5ab0fc3.pdf",
    "fileOrignalPath": "public/invoices/invoice-1648648996317.pdf"
  })
  return resp;
}

functions.cronTester = async (params) => {
  let newDate = new Date().setMinutes(new Date().getMinutes() + 1)

  return scheduleCron(newDate, {
    type: 'function',
    functionName: 'sendMail',
    tag: 'sixHourPriorSession',
    data: {
      to: 'puneetn91@gmail.com',
      subject: 'test subject',
      type: 'communication',
      options: {
        message: 'test messages'
      }
    }
  }, { sessionId: '624471f21425ec4eb41fd38a' }, '12123')
}

functions.testEncryption = (param) => {
  return encryptData({
    "name": 'puneet',
    'id': '123'
  }, '1234')
}

functions.testDecryption = (params) => {
  return decryptData('kf7YKFKKngo7+CgrnvF37oShrzDmjPtZvvF1qtHqaMkvu8O+3gNtHPquLc1x4XhsPCYviAO7UCZMOt4RgxaqdbtvVtBfojiLIqAxlxh5DOY9BebrjNJSVq5P1H9b1W1OBBVv0IlhkkCouXWvtBBdaBUYqa6XnoHwZFeCKBTdPNw=', '1234')
}

functions.fatSecretTest = async (params) => {
  let fatSecretToken = await fatSecretMid.getToken()
  return await getfatSecretData({
    method: 'foods.search',
    search_expression: 'Rice'
  }, {
    fatSecretToken
  })
}

exports.test = async (req, res) => {
  let resp = 'no data';
  console.log("Testing triggered")
  try {
    resp = await functions.testSendNotice();
    res.send(resp)
  } catch (e) {
    res.status(500).send(responseJson(0, [], 'failed', e))
  }
}

exports.utilsTester = functions
