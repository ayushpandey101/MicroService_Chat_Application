import amqp from 'amqplib';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export const startSendOtpConsumer = async()=>{
    try{
        const connection = await amqp.connect({
            protocol:"amqp",
            hostname: process.env.Rabbitmq_Hostname,
            port:5672,
            username: process.env.Rabbitmq_Username,
            password: process.env.Rabbitmq_Password,
        });
        
        const channel =await connection.createChannel();
        const queueName = 'send-otp'
        await channel.assertQueue(queueName,{durable:true});
        console.info("Mail service consumer started, listening for OTP emails");
        channel.consume(queueName, async(msg)=>{
            if(msg){
                try{
                    const {to,subject,body} = JSON.parse(msg.content.toString());

                    const transporter = nodemailer.createTransport({
                        host: "smtp.gmail.com",
                        port: 465,
                        auth: {
                            user: process.env.USER,
                            pass: process.env.PASSWORD,
                        },
                    });
                    await transporter.sendMail({
                        from: "Chat app",
                        to,
                        subject,
                        text: body,
                    });

                    console.info(`OTP mail sent to ${to}`);
                    channel.ack(msg);
                }catch(error){
                    console.error("Failed to process rabbitmq message",error)
                }
            }
        })
    }catch(error){
        console.error("Failed to start OTP consumer",error)
    }
}
