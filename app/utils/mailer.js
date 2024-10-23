const nodemailer = require("nodemailer");

exports.sendMail = async(to, sub, body)=>{
    try {
        let transport = nodemailer.createTransport({
            auth: {
                user: "appdevelopments2021@gmail.com",
                pass: "yfsqtdcetmwlauqy"
            },
            service: "gmail"
        });
        return await transport.sendMail({
            from: "appdevelopments2021@gmail.com",
            to: to,
            subject: sub,
            html: body
        });
    } catch (error) {
        throw error;
    }
}