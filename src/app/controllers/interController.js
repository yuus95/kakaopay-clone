const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');

const interDao = require('../dao/interDao');

exports.get_user_info = async function (req, res) {
    const {id}= req.verifiedToken;  
    try{
        const [user_info] = await interDao.get_list(id);

        let result_name = ""
        let result_birthday=`${user_info.birthday.substr(0,4)}.${user_info.birthday.substr(4,2)}.${user_info.birthday.substr(6,2)}`
        let result_phone = `${user_info.phone.substr(0,3)}-${user_info.phone.substr(3,4)}-${user_info.phone.substr(7,4)}`
        if(user_info.gender =='M'){
            result_name= `${user_info.name}/남자`
        }
        else if(user_info.gender =='G'){
            result_name= `${user_info.name}여자`
        }

            
        res.json({
            isSuccess: false,
            code: 1000,
            message: "개인정보 조회 성공",
            result: {
                name:result_name,
                birthday:result_birthday,
                phone:result_phone,
                email:user_info.email
            }
        })

    }catch(err){
        console.error(err);
        logger.error(`example non transaction DB Connection error\n: ${JSON.stringify(err)}`);
        return    res.json({
            isSuccess: false,
            code: 3001,
            message: "개인정보 조회 실패", 
        })
    }

};




exports.post_user_info = async function (req, res) {
    const {id}= req.verifiedToken;  
    let {name,gender,email,birthday,address,occupation,job,job_address,income,use_purpose,tax_country} = req.body;


    if(!name){
        return res.json({
            isSuccess: false,
            code: 2002,
            message: "이름이 입력되지 않았습니다.",
        })
    }

    
    if(!email){
        return res.json({
            isSuccess: false,
            code: 2003,
            message: "이메일이 입력되지 않았습니다.",
        })
    }
    
    if(!address){
        return res.json({
            isSuccess: false,
            code: 2004,
            message: "주소가 입력되지 않았습니다.",
        })
    }  
    
    if(!occupation){
        return res.json({
            isSuccess: false,
            code: 2005,
            message: "직업이 입력되지 않았습니다.",
        })
    }
    
    if(occupation == '직장인'){       
        if(!job){
            return res.json({
                isSuccess: false,
                code: 2010,
                message: "직업이 직장인일경우 직장을 입력해야합니다.",
            })
        }

        if(!job_address){
            return res.json({
                isSuccess: false,
                code: 2011,
                message: "직업이 직장인일경우 직장주소가 입력되야합니다.",
            })
        }
    }     
    if(income<0){
        return res.json({
            isSuccess: false,
            code: 2006,
            message: "소득이 입력되지 않았습니다.",
        })
    }
    
    if(!use_purpose){
        return res.json({
            isSuccess: false,
            code: 2007,
            message: "사용목적이 입력되지 않았습니다.",
        })
    }
    if(!tax_country){
        return res.json({
            isSuccess: false,
            code: 2008,
            message: "납세 국가가 입력되지않았습니다.",
        })
    }
    if(!birthday){
        return res.json({
            isSuccess: false,
            code: 2009,
            message: "생년월일이 입력되지 않았습니다.",
        })
    }
    try{
        if(occupation== '직장인'){
            await interDao.post_user_info(id,name,gender,email,address,occupation,job,job_address,income,use_purpose,tax_country);

        }
           
        else{
            await interDao.post_user_info(id, name, gender, birthday, email, address, occupation, null, null, income, use_purpose, tax_country);

        }
        res.json({
            isSuccess: true,
            code: 1000,
            message: "통합계좌 개인정보 등록완료 ",
        })

    }catch(err){
        console.error(err);
        logger.error(`example non transaction DB Connection error\n: ${JSON.stringify(err)}`);
        return    res.json({
            isSuccess: false,
            code: 3001,
            message: "통합계좌 개설 요청 실패", 
        })
    }

};