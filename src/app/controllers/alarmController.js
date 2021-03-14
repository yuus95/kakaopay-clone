const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');

const alarmDao = require('../dao/alarmDao');

exports.get_list = async function (req, res) {
    const {id}= req.verifiedToken;  
    try{
        const alarm_list = await alarmDao.get_list(id);
        res.json({
            isSuccess: true,
            code: 1000,
            message: "알람 리스트 조회 성공",
            result: {
                alarm_list
            }
        })

    }catch(err){
        console.error(err);
        logger.error(`example non transaction DB Connection error\n: ${JSON.stringify(err)}`);
        return    res.json({
            isSuccess: false,
            code: 3001,
            message: "알람 리스트 조회 실패", 
        })
    }

};