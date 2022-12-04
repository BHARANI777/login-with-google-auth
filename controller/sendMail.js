//using nodemailer sending mail for verify email , reset mail
const nodemailer = require("nodemailer");





//transport to send email
//using smtpTransport for send emails
var smtpTransport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "124003029@sastra.ac.in",
    pass: "9344062405",
  },
  tls: {
    rejectUnauthorized: false
  },
  port: 465,
  host: "smtp.gmail.com",
  secure: true
});
console.log("email create");

//sending email to reset password
module.exports.sendResetEmail = async (email, token) => {

  // change first part to your domain
  var url = "http://localhost:3000/user/reset-password?token=" + token;

  await smtpTransport.sendMail({
    from: "124003029@sastra.ac.in",
    to: email,
    subject: "RESET YOUR PASSWORD",
    text: `Click on this link to reset your password ${url}`,
    html: `<h3> Click on this link to reset your password : ${url} </h3>`,
  });
};


//sending email to verify email
module.exports.sendVerifyEmail = async (email, token) => {
  // change first part to your domain
  console.log("email sent")
  //sending the token via mail for verification
  //in verification we are checking token is same or not
  var url = "http://localhost:3000/user/verifyemail?token=" + token;

  //mode of transport
  await smtpTransport.sendMail({
    from: "124003029@sastra.ac.in",
    to: email, //user email
    subject: "VERIFY Your EMAIL",
    text: `Click on this link to verify ${url}`,
    html: `<h3> Click on this link to verify your email : ${url} </h3>`,
  });
};
