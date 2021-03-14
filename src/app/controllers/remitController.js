const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');
const remitDao = require('../dao/remitDao');
const checkNum = /[0-9]/;

exports.friend = async function (req, res) {
    const {id,email} = req.verifiedToken;
    try{
        const user_number = await remitDao.userNumber(id);
        return res.json({
            isSuccess: true,
            code: 1000,
            message: "친구목록 요청 성공",
            result:{
                user_list: user_number
            }
        })
    }
    catch(err){
        console.error(err)
        return res.json({
            isSuccess: false,
            code: 2001,
            message: "친구목록 요청 실패",
        })
    }
};



exports.clickStatus = async function (req, res) {
    const {id} = req.verifiedToken;
    const {friend_number,account,remit_type,book_mark} = req.query ;


    const connection = await pool.getConnection(async (conn)=>conn);
    
    
    if(!remit_type){
        connection.release();
        return   res.json({
            isSuccess: false,
            code: 2002,
            message: "송금유형이 입력되지않았습니다."
        })
    }
    if((remit_type =='kao')  && (friend_number == null || friend_number =='undefined' || friend_number == "")){
        connection.release();
        return   res.json({
            isSuccess: false,
            code: 2003,
            message: "송금유형이 kao 일 경우 친구번호는 필수입니다."
        })
    }

    if( (remit_type == 'mac' || remit_type == 'acc') &&  (account == null || account =='undefined' || account == "")){
        // if(account == null || account =='undefined' || account == ""){
            connection.release();
            return   res.json({
                isSuccess: false,
                code: 2004,
                message: "송금유형이 mac 또는 acc  일 경우 계좌번호는 필수입니다."
            })
        // }
    }

    if(!book_mark){
        connection.release();
        return   res.json({
            isSuccess: false,
            code: 2005,
            message: "북마크 상태가 입력되지않았습니다."
        })
    }

    if((remit_type == 'mac' || remit_type == 'acc') &&  (account == null || account =='undefined' || account == "")){
        const [recent_list_check] = await remitDao.check_recent(id,account)
        if(recent_list_check.check_num ==0 || null ){
            connection.release();
            return   res.json({
                isSuccess: false,
                code: 2006,
                message: "최근목록에 존재하지 않습니다."
            })
        }
    

    }

    try{
        await connection.beginTransaction(); 
        if(remit_type =='kao'){
            if(book_mark == '1'){
                await remitDao.update_list_book_mark_up(id,friend_number)
                await remitDao.update_friend_book_mark_up(id,friend_number)

                res.json({
                    isSuccess: true,
                    code: 1000,
                    message: "북마크 업데이트 완료",
                    book_mark:'2'
                })
            }
            else if(book_mark =='2'){
                await remitDao.update_list_book_mark_down(id,friend_number)
                await remitDao.update_friend_book_mark_down(id,friend_number)
                res.json({
                    isSuccess: true,
                    code: 1000,
                    message: "북마크 업데이트 완료",
                    book_mark:'1'
                })
            }
        }

        else if(remit_type == 'acc' || remit_type == 'mac'){
            if(book_mark == '1'){
                await remitDao.update_list_account_book_mark_up(id,account)
            
                res.json({
                    isSuccess: true,
                    code: 1000,
                    message: "북마크 업데이트 완료",
                    book_mark:'2'
                })}
             if(book_mark=='2'){
                await remitDao.update_list_account_book_mark_down(id,account)
            
                res.json({
                    isSuccess: true,
                    code: 1000,
                    message: "북마크 업데이트 완료",
                    book_mark:'1'
                })}
        }
        connection.commit();
        connection.release();
    }
    catch(err){
        console.error(err)
        onnection.release();
        connection.rollback();
        return res.json({
            isSuccess: false,
            code: 3001,
            message: "서버오류",
            token: ""
        })
    }

};


exports.bankName = async function (req, res) {
    try{        
    const bank_list =await remitDao.bankName();
    const share_list = await remitDao.share_list();
    res.json({
        isSuccess: true,
        code: 1000,
        message: "은행리스트 요청성공",
        result:{
            bank_list,
            share_list
        }       
    })
    }
    catch(err){
        console.error(err)
        return  res.json({
            isSuccess: false,
            code: 3000,
            message: "은행리스트 요청실패"
        })
    }
};




    exports.bankAccount = async function (req, res) {
        const {id} = req.verifiedToken;
        const {remit_type,bank_name,bank_account,amount} = req.query ;
        if(!remit_type){
            return res.json({
                isSuccess: false,
                code: 2002,
                message: "송금 유형이 입력되지 않았습니다."
            })
        }

        if(!amount){
            return res.json({
                isSuccess: false,
                code: 2003,
                message: "송금 금액이 입력되지 않았습니다."
            })
        }

      

        try{       

        let  account = {}
  
        if(remit_type == 'acc'){
            [account] =await remitDao.getBankAccount(bank_name,bank_account);
            if(!bank_name){
                return res.json({
                    isSuccess: false,
                    code: 2004,
                    message: "송금유형이 acc일경우 은행명이 필요합니다."
                })
            }

            if(!bank_account){
                return res.json({
                    isSuccess: false,
                    code: 2005,
                    message: "송금유형이 acc일경우 계좌번호가 필요합니다."
                })
            }

            if(account== null || account== "" || account== "undefined"){
                return res.json({
                    isSuccess: false,
                    code: 2006,
                    message: "예금주를 확인할 수 없습니다. 계좌번호를 다시 입력해주세요."
                })
            }
        }
            let accountBank ={};

           
                accountBank = await remitDao.getAccountBank(id);
         
            //  accountBank = await remitDao.getAccountBank(id);
            const [userNickName] = await remitDao.getNickName(id);
            let myaccount = {};

                    if(accountBank[0].alias ==""||accountBank[0].alias =="undefined" || accountBank[0].alias == null ){
                        myaccount = `${accountBank[0].bank_name} ${accountBank[0].account}`;
                    }
                    else{
                        myaccount = `${accountBank[0].bank_name} ${accountBank[0].account} (${accountBank[0].alias})` 
                    }
             
            // let count = myAccount.count;
            //     if(count >=1){
            //         count = `무료(기본 ${count}회남음)`
            //     }
            //     else{
            //         count = `수수료 1500원`
            //     }
        
                let [balance_result] =  await remitDao.get_balance(id);
                let {balance} =balance_result
                let remitMoney = Number(amount);
         
                if(remitMoney > balance){
                    if( remit_type == 'mac' && bank_account == accountBank[0].account_result){
                        return res.json({
                            isSuccess: false,
                            code: 2006,
                            message: "주계좌일 경우 잔액만큼만 보낼 수 있습니다."
                        })
                    }
                    let moneyDiff = -(balance -remitMoney)  
                     moneyDiff = Math.ceil(moneyDiff/10000) * 10000 //충전금액
                     moneyDiff= moneyDiff.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                    
                    let user_info = {
                        money_diff:`${moneyDiff}원`,
                        nickname :userNickName.nickname
                    }

                    res.json({
                        isSuccess: true,
                        code: 1001,
                        message: "페이머니 충전필요합니다",
                        result:{
                            myaccount,
                            recipient:account.user_name,
                            user_info
                        }
                    })
                }
                else{
                    let user_info = {
                        money_diff:"없음",
                        nickname :userNickName.nickname
                    }
                    if(remit_type == 'kao'){
                        res.json({
                            isSuccess: true,
                            code: 1002,
                            message: "페이머니 충전이 필요하지 않습니다",
                            result:{
                                myaccount,
                                user_info
                            }
                        })
                    }
                    else{
                        res.json({
                            isSuccess: true,
                            code: 1002,
                            message: "페이머니 충전이 필요하지 않습니다",
                            result:{
                                myaccount,
                                recipient:account.user_name,
                                user_info
                            }
                        })
                    }

                }
        }
        catch(err){
            console.error(err)
            return  res.json({
                isSuccess: false,
                code: 3001,
                message: "계좌 확인 요청 실패"
            })
        }
    };

    

    
    //계좌에서 내계좌 확인
    exports.account_check = async function (req, res) {
        const {id} = req.verifiedToken;
        let {account,remit_type} = req.query ;
        if(!account && !remit_type){
            return res.json({
                isSuccess: false,
                code: 2002,
                message: "계좌번호 또는 송금유형을 입력해주세요"
            })
        }
        try{
            const [myaccount] = await remitDao.myaccount_check(id,account)
            const [list_related_fee] = await remitDao.limit_check(id);  
            if(myaccount.num>=1){
                remit_type = 'mac'
            }
            else if(remit_type != 'mac' && remit_type != 'kao'){
                remit_type = 'acc';
            } 

            let [balance] = await remitDao.get_balance(id);
          
         
            if(balance.balance == "" || balance.balance == null || balance.balance =="undefined"){
                balance.balance = 0;
            }
            let remit_limit = Number(list_related_fee.remit_limit)
            if(remit_type =='mac' || remit_type == 'acc'){
               remit_limit =  remit_limit + Number(balance.balance);
            }
            remit_limit =remit_limit.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            res.json({
                isSuccess: true,
                code: 1000,
                message: "송금한도 확인 요청 성공",
                result:{
                    remit_type,
                    count :list_related_fee.count,
                    remit_limit:`${remit_limit}원`,
                    balance:Number(balance.balance)
                }
            })
        }
        catch(err){
            console.error(err)
            res.json({
                isSuccess: false,
                code: 3001,
                message: "송금한도 확인 요청 실패"
            })           
        }
    };


    //최근목록 친구 목록 잔액 확인 
    exports.limit_check = async function (req, res) {
        const {id} = req.verifiedToken;
        const {remit_type} = req.query ;

        if(!remit_type || remit_type != 'mac' && remit_type != 'acc' && remit_type!= 'kao'  )
        {     
             return res.json({
            isSuccess: false,
            code: 2002,
            message: "송금 유형이 비어있거나 제대로 입력되지않았습니다."
        })

        }
        try{
            const [list_related_fee] = await remitDao.limit_check(id);  

            const [balance] = await remitDao.get_balance(id);
            if(balance.balance == "" || balance.balance == null || balance.balance =="undefined"){
                balance.balance = 0;
            }
            let remit_limit = Number(list_related_fee.remit_limit)
          if(remit_type =='mac' || remit_type == 'acc'){
             remit_limit =  remit_limit + Number(balance.balance);
          }
          remit_limit =remit_limit.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            res.json({
                isSuccess: true,
                code: 1000,
                message: "송금한도 확인 성공",
                reuslt:{
                    count :list_related_fee.count,
                    remit_limit:`${remit_limit}원 `
                }
            })
        }
        catch(err){
            console.error(err)
            res.json({
                isSuccess: false,
                code: 3001,
                message: "송금한도 확인 실패"
            })           
        }
    };
    
    exports.remit = async function (req, res) {
        const {id} = req.verifiedToken;
        const {friend_number,recipient,image,nickname,
            remit_bank_name,remit_account,payment_type
            ,amount,remit_type} = req.body ;

            const [fee_list] = await remitDao.get_fee_list(id);
            let nickname_result = "";
            let friend_num=null;
        let amount_num = Number(amount.replace(/,/g, ''));
         const transaction_type ="송금";
        let remit_confirm = "" 
        let book_mark ="1"
        let bank_name =remit_bank_name ;
        let bank_account = remit_account;
        let remit_fee = 0 ;
        if(fee_list.count == 0 ){
            remit_fee = 100;
        }


        

        if(!recipient){
                return res.json({
                    isSuccess: false,
                    code: 2002,
                    message: "수취인이 입력되지 않았습니다."
            })
        }

        if(!image){
            return res.json({
                isSuccess: false,
                code: 2003,
                message: "프로필 이미지가 없습니다."
            })
        }
        
        if(!payment_type){
            return res.json({
                isSuccess: false,
                code: 2008,
                message: "지불 유형이 입력되지않았습니다."
            })
        }
        
 
        if(!amount){
            return res.json({
                isSuccess: false,
                code: 2009,
                message: "금액이 입력되지 않았습니다."
            })
        }
    
    

        if(!remit_type || remit_type != 'mac' && remit_type != 'acc' && remit_type!= 'kao'  )
        {     
             return res.json({
            isSuccess: false,
            code: 2012,
            message: "송금 유형이 비어있거나 제대로 입력되지않았습니다."
         })
        }

        if(remit_type == 'kao'){
            if(!friend_number){
                return res.json({
                    isSuccess: false,
                    code: 2004,
                    message: "송금유형이 kao일 경우 friend_number는 필수입니다."
                 })
            }
            else if(checkNum.test(friend_number)==false){
                return res.json({
                    isSuccess: false,
                    code: 2015,
                    message: "friend_number는 숫자만 입력할 수 있습니다."
                 })
            }


            if(!nickname){
                return res.json({
                    isSuccess: false,
                    code: 2005,
                    message: "송금유형이 kao일 경우 nickname은 필수입니다."
                 }) 
            }
            const [bookmark_check] = await remitDao.getbookmark(id,friend_number);
            book_mark = bookmark_check.book_mark
            remit_confirm = false 
            nickname_result=nickname;
            bank_name="";
            bank_account="";
            friend_num= friend_number;
        }

        if(remit_type =='acc' || remit_type =='mac'){
            if(!remit_bank_name){
                return res.json({
                    isSuccess: false,
                    code: 2006,
                    message: "송금유형이 kao가 아닐 경우 은행명은 필수입니다."
                 }) 
            }

            if(!remit_account){
                return res.json({
                    isSuccess: false,
                    code: 2007,
                    message: "송금유형이 kao가 아닐 경우 송금계좌는 필수입니다."
                 }) 
            }

            if(checkNum.test(bank_account)==false){
                return res.json({
                    isSuccess: false,
                    code: 2010,
                    message: "계좌번호는 숫자만 입력되야합니다."
                 })
            }

            if(checkNum.test(bank_name)==true){
                return res.json({
                    isSuccess: false,
                    code: 2011,
                    message: "은행명은 숫자가 포함되지않습니다."
                 })
            }
            remit_confirm = true
            if(!nickname){
                nickname_result = "";
            }
     
        }
        
        if(remit_fee == null){
            return res.json({
                isSuccess: false,
                code: 2013,
                message: "송금수수료가 입력되지 않았습니다."
            })
        }

           
        if(checkNum.test(remit_fee == false)){
            return res.json({
                isSuccess: false,
                code: 2014,
                message: "송금 수수료는 숫자만 입력됩니다."
            })
        }
        const connection =await pool.getConnection(async (conn)=>conn);
        await connection.beginTransaction();
        try{


              const send_list=  await remitDao.send_remit(id, friend_num,recipient,image,nickname_result,bank_name,bank_account,payment_type,amount_num,transaction_type,remit_type,remit_fee,remit_confirm)
              const [user_list] = await remitDao.get_userinfo(id);
          


              //송금부분 

             if(remit_type =='kao'){ //카카오페이로 보낼 경우 상대방 내역에 받기 내역 추가
                    await remitDao.remit_receive(friend_num,id,user_list.name,user_list.user_image,user_list.nickname,amount_num,send_list.insertId)  
                    const [recent_list_friend_check] = await remitDao.check_friend_recent(id,friend_num,bank_account)      
                    if(recent_list_friend_check.check_num>=1){ //최근리스트 업데이트
                        await remitDao.update_recent_friend_list(id,friend_num)  
                    }
                    else{ //최근리스트 생성
                        await remitDao.recent_list(id, friend_num, image, recipient,null,null, book_mark,nickname_result,remit_type)
                    }
                }
            if(remit_type =='acc' || remit_type =='mac'){
                const [recent_list_account_check] = await remitDao.check_account_recent(id,bank_account)
                if(recent_list_account_check.check_num>=1){ //최근리스트 업데이트
                    await remitDao.update_recent_account_list(id,bank_account)  
                }
                else{ //최근리스트 생성
                    await remitDao.recent_list(id, null, image, recipient,bank_name,bank_account, book_mark,nickname_result,remit_type)
                }
            }   
        
            
            //송금한도 업데이트 부분 
          
            let result_count=0;
            let result_limit=0;
            if(fee_list.count - 1 >=1){
                 result_count = fee_list.count - 1; 
            }
            if(fee_list.remit_limit-amount_num >= 0){
                 result_limit = fee_list.remit_limit-amount_num
            }
            await remitDao.update_remit_limit(id,result_count,result_limit)


            await connection.commit() // 커밋
            //송금결과 

            const [balance_after_remit] = await remitDao.balance_after_remit(id,send_list.insertId);
            
            if(remit_type== 'kao'){
                res.json({
                    isSuccess: true,
                    code: 1000,
                    message: "송금 요청 성공",
                    result:{
                        amount:`${amount_num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}원`,
                        recipient:`${recipient}(${nickname_result})`,
                        balance:`${balance_after_remit.balance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}원`
                    }
                })
            }
            else if (remit_type == 'mac' || remit_type =='acc'){
                res.json({
                    isSuccess: true,
                    code: 1000,
                    message: "송금 요청 성공",
                    result:{
                        remit_number :send_list.insertId,
                        amount:`${amount_num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}원`,
                        recipient,
                        bank_account:`${bank_name}${bank_account}`,
                        balance:`${balance_after_remit.balance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}원`
                    }
                })
            }
  
        }
        catch(err){
            console.error(err)
            await connection.rollback() // 롤백
            res.json({
                isSuccess: false,
                code: 3001,
                message: "송금 요청 실패"
            })           
        }
        finally{
            connection.release();
        }
    };


    
exports.get_recent_list = async function (req, res) {
    const {id} = req.verifiedToken;
   try{        
       const recent_remit_list = await remitDao.get_recent_list(id);

       for(let i= 0; i<recent_remit_list.length; i++){
        if(recent_remit_list[i].friend_number){
            recent_remit_list[i].friend_number= Number(recent_remit_list[i].friend_number);
        }
        else{
            recent_remit_list[i].friend_number = null
        }
        if(recent_remit_list[i].nickname =="" || recent_remit_list[i].nickname == "undefined" ){
            recent_remit_list[i].nickname=null;
        }
        if(recent_remit_list[i].bank_name == "" ||recent_remit_list[i].bank_name =="undefined" ){
            recent_remit_list[i].bank_name = null
            recent_remit_list[i].account= null
        }
    }

    res.json({
        isSuccess: true,
        code: 1000,
        message: "최근목록 리스트 요청성공",
        result:{
            recent_remit_list
        }       
    })
    }
    catch(err){
        console.error(err)
        return  res.json({
            isSuccess: false,
            code: 3000,
            message: "최근목록 리스트 요청 실패"
        })
    }
};


    
exports.get_book_mark_list = async function (req, res) {
    const {id} = req.verifiedToken;
   try{        
       let book_mark_list = await remitDao.get_book_mark_list(id);
       for(let i= 0; i<book_mark_list.length; i++){
           if(book_mark_list[i].friend_number){
            book_mark_list[i].friend_number= Number(book_mark_list[i].friend_number);
           }
           else{
             book_mark_list[i].friend_number = null
           }
           if(book_mark_list[i].nickname =="" || book_mark_list[i].nickname == "undefined" ){
                book_mark_list[i].nickname=null;
           }
           if(book_mark_list[i].bank_name == "" ||book_mark_list[i].bank_name =="undefined" ){
            book_mark_list[i].bank_name = null
            book_mark_list[i].account= null
           }
        delete book_mark_list[i].update_at ;
       }
    res.json({
        isSuccess: true,
        code: 1000,
        message: "북마크 리스트 요청 성공",
        result:{
            book_mark_list
        }       
    })
    }
    catch(err){
        console.error(err)
        return  res.json({
            isSuccess: false,
            code: 3001,
            message: "북마크 리스트 요청 실패"
        })
    }
};


    
exports.get_remit_confirm_list = async function (req, res) {
    const {id} = req.verifiedToken;
    const {year}=req.query;

   try{        
    const book_mark_list = await remitDao.get_remit_confirm_list(id,year);
      

    let box=[];
    for(let i = 0; i<book_mark_list.length; i++){
   
      
        if( book_mark_list[i].remit_type =='acc'){
            book_mark_list[i].bank_list= `(${book_mark_list[i].bank}${book_mark_list[i].account})`;
            if(book_mark_list[i].relative_name.length>8){
                book_mark_list[i].relative_name = `${book_mark_list[i].relative_name.substr(0,8)}**`
                
            }
            else if(book_mark_list[i].relative_name.length==3){
                book_mark_list[i].relative_name = `${book_mark_list[i].relative_name.substr(0,1)}*${book_mark_list[i].relative_name.substr(2,1)}`
            }
                book_mark_list[i].name = `${book_mark_list[i].relative_name}${book_mark_list[i].bank_list}`
            if(book_mark_list[i].name.length>=12){
                book_mark_list[i].name=`${book_mark_list[i].name.substr(0,12)}…`
            }
        }
        if(book_mark_list[i].remit_type=='mac'){
            book_mark_list[i].bank_list= `(${book_mark_list[i].bank}***${book_mark_list[i].account})`;
                    if(book_mark_list[i].nickname ==  "" || book_mark_list[i].nickname == 'null' || book_mark_list[i].nickname== "undefined" || book_mark_list[i].nickname==null){
                        book_mark_list[i].name = `${book_mark_list[i].relative_name}${book_mark_list[i].bank_list}`
                    }
                    else{
                        book_mark_list[i].name = `${book_mark_list[i].nickname}${book_mark_list[i].bank_list}`
                    }
        }
        if(book_mark_list[i].remit_type=='kao'){
            book_mark_list[i].name = `${book_mark_list[i].nickname}(${book_mark_list[i].relative_name.substr(0,1)}*${book_mark_list[i].relative_name.substr(2,1)})`
        }


        book_mark_list[i].date= `${book_mark_list[i].month} ${book_mark_list[i].day} ${book_mark_list[i].time}`;
        book_mark_list[i].amount = `${book_mark_list[i].amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}원`
        book_mark_list[i].month = new Date(book_mark_list[i].month).getMonth()+1;
        box[i]= {
            id: book_mark_list[i].id,
            month :book_mark_list[i].month,
            name:book_mark_list[i].name,
            date:book_mark_list[i].date,
           amount: book_mark_list[i].amount,
        }
    }
    
    let remit_list=[];
        for(let i=0; i<12; i++){
            let test = box.filter((item)=>{
                return item.month == i + 1
            })    
            remit_list[i]=test;
        }

    res.json({
        isSuccess: true,
        code: 1000,
        message: "송금확인증 리스트 요청 성공",
        result:{
            remit_list
        }       
    })
    }
    catch(err){
        console.error(err)
        return  res.json({
            isSuccess: false,
            code: 3001,
            message: "송금확인증 요청 실패"
        })
    }
};

 
exports.remit_memo = async function (req, res) {
    const {id} = req.verifiedToken;
    const {remit_number}=req.body
    let {memo}=req.body;

    const [user_info] = await remitDao.get_userinfo(id);

    if(!remit_number){
        return  res.json({
            isSuccess: false,
            code: 2002,
            message: "송금 번호를 입력해주세요"
        })
    }

    if(!memo || memo =="" || memo ==null || memo =='undefined'){
        memo = user_info.name;
    }
     
   try{        
        await remitDao.update_remit_memo(remit_number,memo)
        res.json({
            isSuccess: true,
            code: 1000,
            message: "메모 업데이트 완료"
        })
    }
    catch(err){
        console.error(err)
        return  res.json({
            isSuccess: false,
            code: 3001,
            message: "메모 업데이트 실패 "
        })
    }
};




    
exports.get_remit_confirm_id = async function (req, res) {
    const {remit_number}=req.params
    if(!remit_number){
        return  res.json({
            isSuccess: false,
            code: 2002,
            message: "송금번호를 확인해주세요"
        })
    }

   try{        
       let [remit_detail] = await remitDao.get_remit_confirm_id(remit_number);
    if(!remit_detail|| remit_detail =='undefined' || remit_detail==null){
        return  res.json({
            isSuccess: false,
            code: 2003,
            message: "송금 세부사항 내용이 없습니다. 송금번호를 확인해주세요"
        })
    }
    

    if(remit_detail.recipient.length == 3){
        remit_detail.recipient = `${remit_detail.recipient.substr(0,1)}*${remit_detail.recipient.substr(2,1)}`
    }
   else  if(remit_detail.recipient.length>8){
        remit_detail.recipient= `${remit_detail.recipient.substr(0,8)}**`
    } 

    remit_detail.remit_date =`${remit_detail.remit_date.substring(0,10)}, ${remit_detail.remit_date.substring(11,19)}`
    remit_detail.amount = `${remit_detail.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}원`
    remit_detail.fee = `${remit_detail.fee.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}원`

    if(remit_detail.remit_type =='kao'){
        delete remit_detail.remit_bank_name
        delete remit_detail.remit_account
        delete remit_detail.memo
    }

    if (remit_detail.remit_type =='mac' || remit_detail.remit_type =='acc'){
        delete remit_detail.remit_confirm_day
        if(remit_detail.memo =='' ||remit_detail.memo ==null || remit_detail.memo =="undefined"){
            remit_detail.memo = remit_detail.remit_user
        }
    }
    delete remit_detail.remit_type
    res.json({
        isSuccess: true,
        code: 1000,
        message: "송금 세부사항 요청 성공",
        result:remit_detail
    })
    }
    catch(err){
        console.error(err)
        return  res.json({
            isSuccess: false,
            code: 3001,
            message: "송금 세부사항 요청 실패"
        })
    }
};

   
exports.get_amount_charge_list = async function (req, res) {
    const {id}=req.verifiedToken;

   

   try{        
        const charge_list = await remitDao.get_amount_charge_list(id);
        let list = [];
        for(let i=0; i<charge_list.length; i++){
            let bank_name = `${charge_list[i].bank_name} ${charge_list[i].account}`;
            let {alias} = charge_list[i]
            if(charge_list[i].alias ==null || charge_list[i].alias =='undefined' || charge_list[i].alias =="" ){
                alias= "별명 미설정"
            }
            list[i]={
                bank_number : charge_list[i].bank_number,
                bank_name,
                alias
            }
        }
    
        res.json({
            isSuccess: true,
            code: 1000,
            message: "충전계좌 리스트 요청 성공",
            result:list
        })
    }
    catch(err){
        console.error(err)
        return  res.json({
            isSuccess: false,
            code: 3001,
            message: "충전계좌 리스트 요청 실패"
        })
    }
};


   
exports.amount_charge = async function (req, res) {
    const {id}=req.verifiedToken;
    const {bank_number,amount} = req.body;
    const image = 'data:image/png;base64,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';


    if(!bank_number){
        return  res.json({
            isSuccess: false,
            code: 2002,
            message: "은행번호가 입력되지 않았습니다."
        })
    }

    if(!amount){
        return  res.json({
            isSuccess: false,
            code: 2003,
            message: "금액이 입력되지 않았습니다."
        })
    }
    const amount_num =Number(amount.replace(/,/g, ''))
    const [bank_balance] = await remitDao.get_bank_balance(id,bank_number);
    const {bank_name,account,alias,balance} = bank_balance;
    if(amount_num > balance ){
        return  res.json({
            isSuccess: false,
            code: 2004,
            message: "잔액이 부족합니다."
        })
    }
    
   try{        
    const list = await remitDao.charge_amount(id,image, alias, bank_name, account, '페이머니', amount_num, '충전')
    let {insertId} =list; 
    let [result_balance] = await remitDao.balance_after_remit(id,insertId);
    let charge_account={}
    if(alias == '' || alias == null || alias == "undefined"){
        charge_account = `${bank_name} ${account.substr(-4)}`
    }
     charge_account = `${bank_name} ${account.substr(-4)} (${alias})`
        res.json({
            isSuccess: true,
            code: 1000,
            message: "충전 요청 성공",
            result:{
                charge_account,
                balance:`${result_balance.balance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}원`
            }
        })
    }
    catch(err){
        console.error(err)
        return  res.json({
            isSuccess: false,
            code: 3001,
            message: "충전 요청 실패"
        })
    }
};



 
exports.remit_receive = async function (req, res) {
    const {id}=req.verifiedToken;
    const {remit_number} = req.body;

    if(!remit_number){
        return  res.json({
            isSuccess: false,
            code: 2002,
            message: "송금번호가 없습니다."
        })
    }
    const [receive_check] = await remitDao.receive_check(id,remit_number);
    
    if(!receive_check){

        return  res.json({
            isSuccess: false,
            code: 2004,
            message: "송금 관련된 번호가 아닙니다."
        })
    }

    if(receive_check.remit_confirm ==1 ){
        return  res.json({
            isSuccess: false,
            code: 2003,
            message: "이미 받은 내역입니다."
        })
    }
    
    const connection = await pool.getConnection(async (conn)=>conn)
   
 
    let [balance_number] =await remitDao.get_balance_number(id,remit_number);

    await connection.beginTransaction();
   try{        
  
                await remitDao.update_receive_status(id,remit_number);
                await remitDao.update_remit_status(remit_number);
    

           connection.commit();
           connection.release();

           let [remit_info] = await remitDao.get_remit_info(remit_number);
           let [result_balance] = await remitDao.balance_after_remit(id,balance_number.id);
           res.json({
            isSuccess: true,
            code: 1000,
            message: "받기 요청 성공",
            result:{
                remit_user:`${remit_info.name} (${remit_info.name.substr(0,1)}*${remit_info.name.substr(2,1)})`,
                remit_date :`${remit_info.month.replace(/-/g,".")}.${remit_info.day}${remit_info.time} `,
                balance : `${result_balance.balance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}원`
            }
        })     
    }
    catch(err){
        console.error(err)
        connection.rollback();
        connection.release();
        return  res.json({
            isSuccess: false,
            code: 3001,
            message: "받기 요청 실패"
        })
    }
};





exports.get_transaction_list = async function (req, res) {
    const {id}=req.verifiedToken;
    let {year,month,condition} = req.query ;
    if(!year){
        return  res.json({
            isSuccess: false,
            code: 2002,
            message: "연도가 없습니다."
        })
    }
    if(!month){
        return  res.json({
            isSuccess: false,
            code: 2003,
            message: "월에 대한 내용이 없습니다."
        })
    }
    if(!condition){
        return  res.json({
            isSuccess: false,
            code: 2004,
            message: "조건이 없습니다."
        })
    }

    year =Number(year);
    month=Number(month);
    let tran_list=[];
    if(condition == 'all'){
         tran_list = await remitDao.get_tran_list(id,year,month);
    }
    
    
    let before_list = tran_list.filter((item)=>{
        return item.transaction_type=='받기' && item.remit_confirm ==0
    })
    
   let now_year = new Date().getFullYear();
   let now_month = new Date().getMonth()+1;
   let now_day = new Date().getDate();

   if(now_year == year && month == now_month){
    for(let i=0; i<before_list.length;i++){
        if(  before_list[i].day == now_day ){
            before_list[i].day = '오늘';
        }  
    }        
 }
  const [user_info] = await remitDao.get_userinfo(id);
    //받기전 리스트
    let list_before_receive =[];
    for(let i=0; i<before_list.length;i++){
        list_before_receive[i]={
            day:before_list[i].day,
            name: `${before_list[i].nickname}(${before_list[i].relative_name.substr(0,1)}*${before_list[i].relative_name.substr(2,1)})`,
            transaction_date:before_list[i].time,
            transaction_type:before_list[i].transaction_type,
            amount:`${before_list[i].amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}원`,
            related_number:before_list[i].number_related_remit
        }
    }



   //받기전을 제외한 리스트
    let transaction_list=[];
    let tran_list_result = tran_list.filter((item)=>{
        return !(item.transaction_type=='받기' && item.remit_confirm ==0)
    })
 
    for(let i=0; i<tran_list_result.length;i++){
        let result_name='' ;
        tran_list_result[i].bank_list= `(${tran_list_result[i].remit_bank_name}${tran_list_result[i].remit_account.substr(-4)})`;
        if(tran_list_result[i].transaction_type=='송금'){
            if( tran_list_result[i].remit_type =='acc'){
            
                if(tran_list_result[i].relative_name.length>8){
                    tran_list_result[i].relative_name = `${tran_list_result[i].relative_name.substr(0,8)}**`
                    
                }
                else if(tran_list_result[i].relative_name.length==3){
                    tran_list_result[i].relative_name = `${tran_list_result[i].relative_name.substr(0,1)}*${tran_list_result[i].relative_name.substr(2,1)}`
                }
                    tran_list_result[i].name = `${tran_list_result[i].relative_name}${tran_list_result[i].bank_list}`
                if(tran_list_result[i].name.length>=12){
                    tran_list_result[i].name=`${tran_list_result[i].name.substr(0,12)}…`
                }
            }
            if(tran_list_result[i].remit_type=='mac'){
                tran_list_result[i].bank_list= `(${tran_list_result[i].bank}***${tran_list_result[i].account})`;
                        if(tran_list_result[i].nickname ==  "" || tran_list_result[i].nickname == 'null' || tran_list_result[i].nickname== "undefined" || tran_list_result[i].nick==null){
                            tran_list_result[i].name = `${tran_list_result[i].relative_name}${tran_list_result[i].bank_list}`
                        }
                        else{
                            tran_list_result[i].name = `${tran_list_result[i].nickname}${tran_list_result[i].bank_list}`
                        }
            }
            if(tran_list_result[i].remit_type=='kao'){
                tran_list_result[i].name = `${tran_list_result[i].nickname}(${tran_list_result[i].relative_name.substr(0,1)}*${tran_list_result[i].relative_name.substr(2,1)})`
            }
        }
        if(tran_list_result[i].transaction_type =='충전'){
            if(tran_list_result[i].nickname == null || tran_list_result[i].nickname =='undefined' || tran_list_result[i].nickname ==""){
                tran_list_result[i].name = `${user_info.name}${tran_list_result[i].bank_list}`
            }
            else{
                tran_list_result[i].name=`${tran_list_result[i].nickname}${tran_list_result[i].bank_list}`
            }
        }

        if(tran_list_result[i].transaction_type =='받기'){
            if(tran_list_result[i].nickname == null || tran_list_result[i].nickname =='undefined' || tran_list_result[i].nickname ==""){
                tran_list_result[i].name = `${user_info.name}${tran_list_result[i].bank_list}`
            }
            else{
                tran_list_result[i].name = `${tran_list_result[i].nickname}(${tran_list_result[i].relative_name.substr(0,1)}*${tran_list_result[i].relative_name.substr(2,1)})`
            }
        }
       

        transaction_list[i]={
            day:tran_list_result[i].day,
            name: `${tran_list_result[i].name}`,
            transaction_date:tran_list_result[i].time,
            transaction_type:tran_list_result[i].transaction_type,
            amount:`${tran_list_result[i].amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}원`
            
        }
    }

    try{ 
             res.json({
            isSuccess: true,
            code: 1000,
            message:  "내역 조회 성공",
            result:{
                transaction_list,
                list_before_receive
            }
        })     
    }
    catch(err){
        console.error(err)
        connection.rollback();
        connection.release();
        return  res.json({
            isSuccess: false,
            code: 3001,
            message: "내역 조회 실패"
        })
    }
};