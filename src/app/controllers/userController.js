const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');
const CryptoJS = require("crypto-js");
const axios = require('axios');
const jwt = require('jsonwebtoken');
const regexEmail = require('regex-email');
const crypto = require('crypto');
const secret_config = require('../../../config/secret');
const reg = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;
const request = require('request');

const userDao = require('../dao/userDao');
const { constants } = require('buffer');
const nodemailer = require('nodemailer');
require('dotenv').config();

const checkNum = /[0-9]/;

// let phoneAuthNumber = Math.floor(random * 799999+100000);


exports.phoneCheck = async function (req, res) {
    const {phone,auth_number} = req.query;
    if (!phone) return res.json({isSuccess: false, code: 2001, message: "핸드폰 번호를 입력해주세요"});
    if (!auth_number) return res.json({isSuccess: false, code: 2002, message: "인증번호를 입력해주세요"});
    let authCheck = await userDao.authPhoneCheck(phone);
    let time = new Date();
    let time2 = new Date(authCheck[0].update_at);

    let timeDiff =Math.floor((time - time2)/1000/60) ;

    if(timeDiff >=5){
        return res.json({
            isSuccess: false,
            code: 2003,
            message: "시간 초과 5분 경과되었습니다. ",
            confirm:"N"
        });
    }
    else {
        if(auth_number == authCheck[0].auth_number){
            return res.json({
                isSuccess: true,
                code: 1000,
                message: "인증 성공",
                confirm:"Y"
            });
        }
        else{
            return res.json({
                isSuccess: false,
                code: 2004,
                message: "인증 번호가 틀립니다.",
                confirm:"N"
            });
        }
    }
};

exports.phone = async function (req, res) {
    const {phone} = req.body;
    let random =Math.random();
    let phoneAuthNumber = Math.floor(random * 799999+100000);
    const method = 'POST'
    if (!phone) return res.json({isSuccess: false, code: 2001, message: "번호를 입력해주세요"});
    if (phone.length != 11) return res.json({isSuccess: false, code: 2002, message: "핸드폰 번호를 제대로 입력해주세요"});
    const timestamp = Date.now().toString();
    const url = `https://sens.apigw.ntruss.com/sms/v2/services/${process.env.naverKey}/messages`
    const signature = makeSignature();
    const connection = await pool.getConnection(async (conn)=>conn);
    let [checkPhone] = await userDao.checkPhoneUser(phone);
    if(checkPhone.phone_user>=1){
        return res.json({
            isSuccess: false,
            code: 2003,
            message: "번호로 가입한 아이디가 있습니다."
        });
    }

   let checkAuth =  await userDao.checkMesAuth(phone);
   let time = new Date();
   let timeDiff =Math.floor((time - checkAuth[0].update_at)/1000/60/60)  ;

   if(timeDiff<=24 && checkAuth[0].count>=100){
       return res.json({
           isSuccess: false,
           code: 2004,
           message: "하루 인증 횟수 초과"
       });
   }
   else if(timeDiff>=24 && checkAuth[0].count>=5){
       await userDao.initAuthPhone(phone)
   }

    function makeSignature() {
        var space = " ";				// one space
        var newLine = "\n";				// new line
        				// method
        const url2 = `/sms/v2/services/${process.env.naverKey}/messages`;	// url (include query string)
        	// current timestamp (epoch)
        const accessKey = process.env.naverAccessKey;			// access key id (from portal or Sub Account)
        const secretKey = process.env.naverSecretKey;			// secret key (from portal or Sub Account)
    
        var hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, secretKey);
        hmac.update(method);
        hmac.update(space);
        hmac.update(url2);
        hmac.update(newLine);
        hmac.update(timestamp);
        hmac.update(newLine);
        hmac.update(accessKey);
    
        var hash = hmac.finalize();
    
        return hash.toString(CryptoJS.enc.Base64);
    }


    try{        
      let result =  await request({
            method: method,    
            json: true,   
            uri: url, 
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'x-ncp-iam-access-key' : process.env.naverAccessKey,       
                'x-ncp-apigw-timestamp': timestamp,
                'x-ncp-apigw-signature-v2': signature
            },
            body: {
                "type":"SMS",
                "contentType":"COMM",
                "countryCode":"82",
                "from": "01047105883",
                "content":`[인증번호:${phoneAuthNumber}] 카카오 계정 인증 번호입니다.`,       
                "messages":[
                    {
                        "to":`${phone}`      
                    }
                ]
            }
        },function (err, res, html) {
            if(err) {
                connection.release();
                return res.json({isSuccess: false, code: 3003, message: "메세지 전송 실패"});
            }          
        });   

        try{
            await connection.beginTransaction();
            if(checkAuth[0].check_number<1|| checkAuth[0].check_number ==0){
            await userDao.insertMesAuth(phone,phoneAuthNumber,1);
            await connection.commit(); // COMMIT
            connection.release();
            return res.json({
                isSuccess: true,
                code: 1000,
                message: "인증 번호 보내기 성공"
            });
            }
            else{
            await userDao.updateMesAuth(phone,phoneAuthNumber,checkAuth[0].count+1);
            await connection.commit(); // COMMIT
            connection.release();
            return res.json({
                isSuccess: true,
                code: 1000,
                message: "인증 번호 보내기 성공"
            });
            }	             
        }
       catch(err){
           console.error(err)  
           await connection.rollback(); // ROLLBACK
           connection.release();
          return res.json({isSuccess: false, code: 3004, message: "메세지 전송 실패"});
       }
    }    
     catch(err){
         console.error(err);
        connection.release();
     }
}
exports.emailCheck = async function (req, res) {
    const {email,auth_number} = req.query;
    if (!email) return res.json({isSuccess: false, code: 2001, message: "이메일을 입력해주세요."});
    if (!auth_number) return res.json({isSuccess: false, code: 2002, message: "인증번호를 입력해주세요"});
    let time = new Date();
    let authCheck = await userDao.authCheck(email);
    let timeDiff =Math.floor((time - authCheck[0].update_at)/1000/60)  ; 
  

    if(timeDiff >=5){
        return res.json({
            isSuccess: false,
            code: 2003,
            message: "시간 초과 5분 경과되었습니다. ",
            confirm:"N"
        });
    }
    else {
        if(auth_number == authCheck[0].auth_number){
            return res.json({
                isSuccess: true,
                code: 1000,
                message: "인증 성공",
                confirm:"Y"
            });
        }
        else{
            return res.json({
                isSuccess: false,
                code: 2004,
                message: "인증 번호가 틀립니다.",
                confirm:"N"
            });
        }
    }
};


exports.email = async function (req, res) {
    const {email } = req.body;
    let random = Math.random();
    let authNumber = Math.floor(random * 79999999+10000000);
    if (!email) return res.json({isSuccess: false, code: 2001, message: "이메일을 입력해주세요."});
    if (email.length > 30) return res.json({
        isSuccess: false,
        code: 2002,
        message: "이메일은 30자리 미만으로 입력해주세요."
    });

    if (!regexEmail.test(email)) return res.json({isSuccess: false, code: 2003, message: "이메일을 형식을 정확하게 입력해주세요."});
    try {
        try {
            const connection =await pool.getConnection(async (conn)=>conn)
            // 이메일 중복 확인
            const emailRows = await userDao.userEmailCheck(email); 
            if (emailRows.length > 0) {
                connection.release();
                return res.json({
                    isSuccess: false,
                    code: 3001,
                    message: "중복된 이메일입니다."
                });
            }
            
                try{
                    let transporter = nodemailer.createTransport({
                        service: 'gmail',
                        host: 'smtp.gmail.com',
                        port: 587,
                        secure: true,
                        auth: {
                          user: process.env.email,
                          pass: process.env.emailpw,
                        },
                      });
                    
                      // send mail with defined transport object
                      try{
                        
                        let authCheck = await  userDao.checkEmailAuth(email);
                        let time = new Date();
                        let timeDiff =Math.floor((time - authCheck[0].update_at)/1000/60/60)  ;
                    
                        if(timeDiff<=24 && authCheck[0].count>=1000){
                            connection.release();
                            return res.json({
                                isSuccess: false,
                                code: 3003,
                                message: "하루 인증 횟수 초과"
                            });
                        }
                        else if(timeDiff>=24 && authCheck[0].count>=5){
                            await userDao.initAuth(email)
                        }
                        
                        await transporter.sendMail({
                            from: process.env.email,
                            to: email,
                            subject: '[Kakao] 카카오계정 가입 인증번호',
                            html: `
                        <div style="margin: 0 15%; height: 70px; background-color:#FFDC00; padding: 10px 0px 10px 20px; " > 
                            <div style="padding:15 0px;"><h1>kakao계정</h1></div>
                        </div>
                        <div style="margin: 0 15%;">
                            <div style="padding-left: 2%; padding-bottom: 30px;">
                                 <br>
                                <h4>카카오계정 가입을 위한 인증 번호 입니다.</h3>
                                <br>
                                <br>
                                아래 인증번호를 확인하여 이메일 주소를 완료해 주세요
                            </div>        
                            <div style="border-top: 1px solid #BEBEBE; border-bottom: 1px solid #BEBEBE; height: 50px; padding: 20px 0px; ">
                                <div > <span>카카오계정</span>   <h4 style="display: inline; padding-left: 30px;"> ${email}</h4></div>
                                
                                <div style="padding-top: 10px;">인증번호 <h4 style="display: inline; padding-left: 45px;"> ${authNumber}</h4></div>
                            </div>        
                        </div>
                            `
                          },(err,info)=>{
                              if(err){
                                  console.log(err);
                                  connection.release();
                                  res.json({isSuccess:false,code:3001,message:"메일전송 실패"})
                              }
                              transporter.close();
                          });
                        await connection.beginTransaction();	 
                        if(authCheck[0].check_number <1){
                            try{
                                await userDao.inserEmailAuth(email,authNumber,1)
                                await connection.commit(); // COMMIT
                                 connection.release();
                                 return res.json({
                                    isSuccess: true,
                                    code: 1000,
                                    message: "메일 보내기 성공"
                                });
                            }
                          catch(err){
                              console.error(err);
                              await connection.rollback(); // ROLLBACK
                              connection.release();
                              return res.json({
                                isSuccess: false,
                                code: 3002,
                                message: "메일 전송 실패"
                            });
                          }
                        }
                       else{
                        try{
                            let num  = authCheck[0].count +1;
                            await userDao.updateEmailAuth(email,authNumber,num) 
                            await connection.commit(); // COMMIT
                            connection.release();
                            return res.json({
                                isSuccess: true,
                                code: 1000,
                                message: "메일 보내기 성공"
                            });
                            }
                           catch(err){
                               console.error(err);
                               await connection.rollback(); // ROLLBACK
                               connection.release();
                               return res.json({
                                isSuccess: false,
                                code: 3003,
                                message: "메일 전송 실패"
                            });
                           }
                          
                       }
                      }
                      catch(err){
                          console.error(err);
                          connection.release();
                          return res.json({
                            isSuccess: false,
                            code: 3003,
                            message: "메일 전송 실패"
                          })
                          
                      }
              

                    //   userDao.inserEmailAuth(email,authNumber)
                }
                catch(err){
                    console.error(err);
                    res.json({isSuccess:false,code:3001,message:"메일전송 실패"})
                }
        } catch (err) {
                connection.release();
                return res.json({
                isSuccess: false,
                code: 3003,
                message: "메일 전송 실패"
                })        
        }
    } catch (err) {
        logger.error(`App - SignUp DB Connection error\n: ${err.message}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
};


exports.signUp = async function (req, res) {
    const {
        email, password,name,phone,nickname,birthday,gender,lunar_check
    } = req.body;

    let result_phone = phone  
    if (!email) return res.json({isSuccess: false, code: 2001, message: "이메일을 입력해주세요."});
    if (email.length > 30) return res.json({
        isSuccess: false,
        code: 2002,
        message: "이메일은 30자리 미만으로 입력해주세요."
    });

    if (!regexEmail.test(email)) return res.json({isSuccess: false, code: 2003, message: "이메일을 형식을 정확하게 입력해주세요."});

    if (!password) return res.json({isSuccess: false, code: 2004, message: "비밀번호를 입력 해주세요."});
    if (password.length >30 || false === reg.test(password))  return res.json({
        isSuccess: false,
        code: 2005,
        message: "비밀번호는 8자 이상 32자 이하이어야 하며, 숫자/대문자/소문자/특수문자를 모두 포함해야 합니다."
    });
    if (!nickname) return res.json({isSuccess: false, code: 2006, message: "닉네임을 입력 해주세요."});
    if (nickname.length > 20) return res.json({
        isSuccess: false,
        code: 2007,
        message: "닉네임은 최대 20자리를 입력해주세요."
    });
    if (!birthday) return res.json({isSuccess: false, code: 2008, message: "생년월일을 입력해주세요."});
    if (!gender) return res.json({isSuccess: false, code: 2009, message: "성별을 입력해주세요"});
    if(result_phone ==null || result_phone =='undefined'|| result_phone =="" ){
        result_phone = null
    }
    try {
          // 이메일 중복 확인
          const emailRows = await userDao.userEmailCheck(email);
          if (emailRows.length > 0) {
              return res.json({
                  isSuccess: false,
                  code: 3001,
                  message: "중복된 이메일입니다."
              });
          }

          const phoneCheck = await userDao.userPhoneCheck(phone);
          if(phoneCheck.length>0){
              return res.json({
                  isSuccess: false,
                  code: 3002,
                  message: "중복된 번호입니다."
              });

          }

          // 닉네임 중복 확인
          const nicknameRows = await userDao.userNicknameCheck(nickname);
          if (nicknameRows.length > 0) {
              return res.json({
                  isSuccess: false,
                  code: 3003,
                  message: "중복된 닉네임입니다."
              });
          }
        try {
            const connection = await pool.getConnection(async (conn) =>conn);         

            // TRANSACTION : advanced
         

           await connection.beginTransaction(); // START TRANSACTION
            const hashedPassword = await crypto.createHash('sha512').update(password).digest('hex');
            const insertUserInfoParams = [email, hashedPassword,name,result_phone,nickname,birthday,gender,lunar_check];
           
            try{
                const [insertUserRows] = await userDao.insertUserInfo(insertUserInfoParams);

                const {insertId} = insertUserRows
                await userDao.insertAccountFee(insertId);
                await userDao.inserKaoPsw(insertId);

    
    
                await connection.commit(); // COMMIT
               connection.release();
                return res.json({
                    isSuccess: true,
                    code: 1000,
                    message: "회원가입 성공"
                });
            }
            catch(err){
                console.error(err);
                await connection.rollback(); // ROLLBACK
                connection.release();
                return res.json({
                    isSuccess: false,
                    code: 3001,
                    message: "회원가입 실패"
                });
            }
          
        } catch (err) {
           await connection.rollback(); // ROLLBACK
           connection.release();
            logger.error(`App - SignUp Query error\n: ${err.message}`);
            return res.status(500).send(`Error: ${err.message}`);
        }
    } catch (err) {
        logger.error(`App - SignUp DB Connection error\n: ${err.message}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
};

/**
 update : 2020.10.4
 02.signIn API = 로그인
 **/

exports.signIn = async function (req, res) {
    const {email, password} = req.body;

    if (!email) return res.json({isSuccess: false, code: 2001, message: "이메일을 입력해주세요."});
    if (email.length > 30) return res.json({
        isSuccess: false,
        code: 2001,
        message: "이메일은 30자리 미만으로 입력해주세요."
    });

    if (!regexEmail.test(email)) return res.json({isSuccess: false, code: 2002, message: "이메일을 형식을 정확하게 입력해주세요."});

    if (!password) return res.json({isSuccess: false, code: 2003, message: "비밀번호를 입력 해주세요."});

    try {
      
        const connection = await pool.getConnection(async conn => conn);

        try {
            const [userInfoRows] = await userDao.selectUserInfo(email);

            if (userInfoRows.length < 1) {
                connection.release();
                return res.json({
                    isSuccess: false,
                    code: 2004,
                    message: "아이디를 확인해주세요."
                });
            }

            const hashedPassword = await crypto.createHash('sha512').update(password).digest('hex');

            if (userInfoRows[0].password !== hashedPassword) {
                connection.release();
                return res.json({
                    isSuccess: false,
                    code: 2005,
                    message: "비밀번호를 확인해주세요."
                });
            }
           if (userInfoRows[0].status === "DELETED") {
                connection.release();
                return res.json({
                    isSuccess: false,
                    code: 2006,
                    message: "탈퇴 된 계정입니다. 고객센터에 문의해주세요."
                });
            }
            //토큰 생성
            let token = await jwt.sign({
                    id: userInfoRows[0].id,
                    email: userInfoRows[0].email
                    
                }, // 토큰의 내용(payload)
                secret_config.jwtsecret, // 비밀 키
                {
                    expiresIn: '365d',
                    subject: 'userInfo',
                } // 유효 시간은 365일
            );
            connection.release();
            res.json({
                isSuccess: true,
                code: 1000,
                message: "로그인 성공",
                jwt: token
            });

            
        } catch (err) {
            logger.error(`App - SignIn Query error\n: ${JSON.stringify(err)}`);
            connection.release();
            return false;
        }
    } catch (err) {
        logger.error(`App - SignIn DB Connection error\n: ${JSON.stringify(err)}`);
        return false;
    }
};

exports.logout = async function(req,res){
    res.json({
        isSuccess: true,
        code: 200,
        message: "로그아웃 성공",
        token: ""
    })
};

/**
 update : 2019.09.23
 03.check API = token 검증
 **/
exports.check = async function (req, res) {
    const {id} =req.verifiedToken
    const [list] = await userDao.get_user_list(id)
    let result =list
    res.json({
        isSuccess: true,
        code: 1000,
        message: "자동 로그인 요청 성공",        
        result
    })
};


//카카오페이 비밀번호 확인 
exports.kakaopay_password_check = async function (req, res){
    const {id} = req.verifiedToken;
    const {password} = req.body;
    
    const [kakao_password_check] =  await userDao.kakao_password_check(id,password);
    const {check_num} = kakao_password_check
    try{
        if(check_num>=1){
            res.json({
                isSuccess: true,
                code: 1000,
                message: "비밀번호 인증 완료"
            })
        }
    
        else{
            res.json({
                isSuccess: false,
                code: 2003,
                message: "비밀번호가 틀립니다"
            })
        }
    }
    catch(err){
        console.error(err)
        return res.json({
            isSuccess: false,
            code: 3001,
            message: "비밀번호 인증 실패"
        })

    }
};



exports.kakaopay_password_patch = async function (req, res){
    const {id} = req.verifiedToken;
    const {password,password_confirm} = req.body;


    if(password.length != 6 ){
        return    res.json({
            isSuccess: false,
            code: 2002,
            message: "비밀번호는 6글자를 입력해야 합니다."
        })
    }

    if(password !=password_confirm ){
        return    res.json({
            isSuccess: false,
            code: 2003,
            message: "두 비밀번호가 다릅니다"
        })
    }

    if(checkNum.test(password)==false){
        return    res.json({
            isSuccess: false,
            code: 2004,
            message: "비밀번호는 숫자만 입력해야됩니다."
        })
    }

    
    try{
        await userDao.kakaopay_password_patch(id,password);
        res.json({
            isSuccess: true,
            code: 1000,
            message: "비밀번호 변경 완료"
        })
    }
    catch(err){
        console.error(err)
       return res.json({
            isSuccess: false,
            code: 2003,
            message: "비밀번호 변경 실패"
        })
    }
};





exports.password_check = async function (req, res){
    const {id} = req.verifiedToken;
    const {password} = req.body;

    try{
        const [user_password] = await  userDao.get_password(id);
        const hashedPassword =  await crypto.createHash('sha512').update(password).digest('hex');
    
        if(hashedPassword != user_password.password){
            return    res.json({
                isSuccess: false,
                code: 2002,
                message: "비밀번호가 틀립니다."
            })
        }
        res.json({
            isSuccess: true,
            code: 1000,
            message: "비밀번호 인증 완료 "
        })    
    }
    catch(err){
        console.error(err)
       return res.json({
            isSuccess: false,
            code: 2003,
            message: "비밀번호 인증 실패"
        })
    }
};






exports.kakaopay_phone_auth_post = async function (req, res){
    const {id} = req.verifiedToken;
    let random = Math.random(); 
    const {name,resident_number,agency,phone} = req.body;
    let phoneAuthNumber = Math.floor(random * 799999+100000);

    const method = 'POST'
    const timestamp = Date.now().toString();
    const url = `https://sens.apigw.ntruss.com/sms/v2/services/${process.env.naverKey}/messages`
    const signature = makeSignature();



    if(!name){
        return    res.json({
            isSuccess: false,
            code: 2002,
            message: "이름을 입력해주세요"
        })
    }
    if(!resident_number){
        return    res.json({
            isSuccess: false,
            code: 2003,
            message: "주민등록번호를 입력해주세요"
        })
    }

    
    if(resident_number.length != 7){
        return    res.json({
            isSuccess: false,
            code: 2004,
            message: "주민등록번호 뒷번호 첫번쨰 자리까지 입력해주세요"
        })
    }

    
    if(!agency){
        return    res.json({
            isSuccess: false,
            code: 2005,
            message: "대리점을 입력해주세요"
        })
    }

    
    if(!phone){
        return    res.json({
            isSuccess: false,
            code: 2006,
            message: "핸드폰 번호를 입력해주세요"
        })
    }

    
    if(phone.length != 11){
        return    res.json({
            isSuccess: false,
            code: 2007,
            message: "핸드폰 번호를 제대로 입력해주세요"
        })
    }

    let [phone_check] = await userDao.kakaopay_user_check(name,resident_number,agency,phone)
    if(phone_check ==0 || phone_check == null || phone_check == 'undefined'){
        return    res.json({
            isSuccess: false,
            code: 2008,
            message: "본인 핸드폰 정보가 아닙니다"
        })
    }



    let checkAuth =  await userDao.kakao_phone_count_check(phone);
    let time = new Date();
    let timeDiff =Math.floor((time - checkAuth[0].update_at)/1000/60/60)  ;
   if(timeDiff<=24 && checkAuth[0].count>=100){
    return res.json({
        isSuccess: false,
        code: 2004,
        message: "하루 인증 횟수 초과"
    });
    }
     if(timeDiff>=24 && checkAuth[0].count>=5){
        await userDao.kakao_phone_count_init(phone)
    }
    function makeSignature() {
        var space = " ";				// one space
        var newLine = "\n";				// new line
        				// method
        const url2 = `/sms/v2/services/${process.env.naverKey}/messages`;	// url (include query string)
        	// current timestamp (epoch)
        const accessKey = process.env.naverAccessKey;			// access key id (from portal or Sub Account)
        const secretKey = process.env.naverSecretKey;			// secret key (from portal or Sub Account)
    
        var hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, secretKey);
        hmac.update(method);
        hmac.update(space);
        hmac.update(url2);
        hmac.update(newLine);
        hmac.update(timestamp);
        hmac.update(newLine);
        hmac.update(accessKey);
    
        var hash = hmac.finalize();
    
        return hash.toString(CryptoJS.enc.Base64);
    }
    const connection = await pool.getConnection(async (conn)=>conn);
    try{        
        let result =  await request({
              method: method,    
              json: true,   
              uri: url, 
              headers: {
                  'Content-Type': 'application/json; charset=utf-8',
                  'x-ncp-iam-access-key' : process.env.naverAccessKey,       
                  'x-ncp-apigw-timestamp': timestamp,
                  'x-ncp-apigw-signature-v2': signature
              },
              body: {
                  "type":"SMS",
                  "contentType":"COMM",
                  "countryCode":"82",
                  "from": "01047105883",
                  "content":`[인증번호:${phoneAuthNumber}] 카카오 페이(타인노출금지)`,       
                  "messages":[
                      {
                          "to":`${phone}`      
                      }
                  ]
              }
          },function (err, res, html) {
              if(err) {
                  connection.release();
                  return res.json({isSuccess: false, code: 3003, message: "메세지 전송 실패"});
              }          
          });   
  
          try{
              await connection.beginTransaction();
              if(checkAuth[0].check_number<1|| checkAuth[0].check_number ==0){
              await userDao.kakaopay_phone_auth_insert(phone,phoneAuthNumber);
              await connection.commit(); // COMMIT
              connection.release();
              return res.json({
                  isSuccess: true,
                  code: 1000,
                  message: "인증 번호 보내기 성공"
              });
              }
              else{
              await userDao.kakaopay_phone_auth_update(phone,phoneAuthNumber,checkAuth[0].count+1);
              await connection.commit(); // COMMIT
              connection.release();
              return res.json({
                  isSuccess: true,
                  code: 1000,
                  message: "인증 번호 보내기 성공"
              });
              }	             
          }
         catch(err){
             console.error(err)  
             await connection.rollback(); // ROLLBACK
             connection.release();
            return res.json({isSuccess: false, code: 3004, message: "메세지 전송 실패"});
         }
      }    
       catch(err){
           console.error(err);
          connection.release();
       }
};



exports.kakaopay_phone_auth_get = async function (req, res){
    const {phone,auth_number} = req.query;
    if (!phone) return res.json({isSuccess: false, code: 2004, message: "핸드폰 번호를 입력해주세요"});
    if (!auth_number) return res.json({isSuccess: false, code: 2005, message: "인증번호를 입력해주세요"});
    let time = new Date();
    // let authCheck = await userDao.authPhoneCheck(phone);
    let authCheck = await userDao.kakaopay_phone_auth_check(phone);
    let titme2 = new Date(authCheck[0].update_at)
    let timeDiff =Math.floor((time- titme2)/1000/60) ;
    if(timeDiff >=3){
        return res.json({
            isSuccess: false,
            code: 2003,
            message: "3분이 경과되었습니다. ",
            confirm:"N"
        });
    }
    else {
        try{
            if(auth_number == authCheck[0].auth_number){
                return res.json({
                    isSuccess: true,
                    code: 1000,
                    message: "본인 핸드폰 인증 완료"
                });
            }
            else{
                return res.json({
                    isSuccess: false,
                    code: 2002,
                    message: "인증 번호가 다릅니다.",
                });
            }
        }
        catch(err){
            console.error(err)
            return  res.json({
                isSuccess: false,
                code: 3001,
                message: "본인 핸드폰 인증 실패"
            });
        }
    }
};

